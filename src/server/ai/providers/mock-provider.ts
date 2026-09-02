import type {
  AIProvider,
  ProviderGenerateInput,
  ProviderGenerateResult,
  ToolCallRequest,
} from '@/server/ai/providers/types';

const TOOL_PATTERNS: Array<{
  patterns: RegExp[];
  tool: string;
  args?: (message: string) => Record<string, unknown>;
}> = [
  {
    patterns: [/sales|revenue|how (am i|are we) doing|how much did we sell/i],
    tool: 'get_sales_summary',
    args: () => ({ period: 'this_month' }),
  },
  {
    patterns: [/compare.*month|vs last month|previous month/i],
    tool: 'compare_sales_periods',
    args: () => ({}),
  },
  {
    patterns: [/top product|best.?sell|what sold/i],
    tool: 'get_top_products',
    args: () => ({ limit: 5, period: 'this_month' }),
  },
  {
    patterns: [/low.?stock|running low|out of stock|restock/i],
    tool: 'get_low_stock_products',
    args: () => ({ limit: 10 }),
  },
  {
    patterns: [/best customer|top customer|who are my customer/i],
    tool: 'get_customer_summary',
    args: () => ({ period: 'this_month' }),
  },
  {
    patterns: [/how many order|order count|orders did/i],
    tool: 'get_order_metrics',
    args: () => ({ period: 'this_month' }),
  },
  {
    patterns: [/refund/i],
    tool: 'get_order_metrics',
    args: () => ({ period: 'this_month' }),
  },
  {
    patterns: [/channel|online|pos|storefront/i],
    tool: 'get_channel_performance',
    args: () => ({ period: 'this_month' }),
  },
  {
    patterns: [/opportunit|grow|focus|should i/i],
    tool: 'get_growth_opportunities',
    args: () => ({}),
  },
  {
    patterns: [/search product|find product/i],
    tool: 'search_products',
    args: (m) => ({ query: m.replace(/search products?|find products?/i, '').trim() || 'a' }),
  },
];

function matchTools(message: string, availableTools: string[]): ToolCallRequest[] {
  const lower = message.toLowerCase();
  const calls: ToolCallRequest[] = [];

  for (const entry of TOOL_PATTERNS) {
    if (!availableTools.includes(entry.tool)) continue;
    if (entry.patterns.some((p) => p.test(lower))) {
      calls.push({
        id: `mock-${entry.tool}-${calls.length}`,
        name: entry.tool,
        arguments: entry.args?.(message) ?? {},
      });
      break;
    }
  }

  if (calls.length === 0 && availableTools.includes('get_sales_summary')) {
    if (/business|overview|summary|how/i.test(lower)) {
      calls.push({
        id: 'mock-default',
        name: 'get_sales_summary',
        arguments: { period: 'this_month' },
      });
    }
  }

  return calls;
}

export class MockProvider implements AIProvider {
  readonly name = 'mock';

  async generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult> {
    const lastUser = [...input.messages].reverse().find((m) => m.role === 'user');
    const message = lastUser?.content ?? '';

    const toolResults = input.messages.filter((m) => m.role === 'tool');
    if (toolResults.length > 0) {
      const formatted = formatToolResults(toolResults);
      return {
        content: formatted,
        finishReason: 'stop',
        inputTokens: estimateTokens(input.messages),
        outputTokens: estimateTokens([{ content: formatted }]),
      };
    }

    const available = input.tools.map((t) => t.name);
    const toolCalls = matchTools(message, available);

    if (toolCalls.length > 0) {
      return {
        content: '',
        toolCalls,
        finishReason: 'tool_calls',
        inputTokens: estimateTokens(input.messages),
        outputTokens: 0,
      };
    }

    return {
      content:
        "I can help with sales, inventory, customers, orders, and growth insights. Try asking:\n\n" +
        '- "How are my sales this month?"\n' +
        '- "What are my top products?"\n' +
        '- "What\'s running low in stock?"\n' +
        '- "Who are my best customers?"\n' +
        '- "Give me three opportunities to grow."',
      finishReason: 'stop',
      inputTokens: estimateTokens(input.messages),
      outputTokens: 50,
    };
  }
}

function formatToolResults(toolMessages: Array<{ content: string; name?: string }>): string {
  const parts: string[] = [];

  for (const msg of toolMessages) {
    try {
      const data = JSON.parse(msg.content);
      const tool = msg.name ?? 'tool';

      if (tool === 'get_sales_summary') {
        parts.push(
          `**Sales (${data.period})**\n` +
            `- Revenue: ${formatMoney(data.revenueMinor, data.currency)}\n` +
            `- Net revenue: ${formatMoney(data.netRevenueMinor, data.currency)}\n` +
            `- Orders: ${data.orderCount}\n` +
            `- AOV: ${formatMoney(data.averageOrderValueMinor, data.currency)}`
        );
      } else if (tool === 'compare_sales_periods') {
        parts.push(
          `**Period comparison**\n` +
            `- Current revenue: ${formatMoney(data.current.revenueMinor)}\n` +
            `- Previous revenue: ${formatMoney(data.previous.revenueMinor)}\n` +
            `- Change: ${data.revenueChangePercent}%`
        );
      } else if (tool === 'get_top_products') {
        const list = (data.products as Array<{ name: string; revenueMinor: number; quantity: number }>)
          .map((p, i) => `${i + 1}. **${p.name}** — ${formatMoney(p.revenueMinor)} (${p.quantity} sold)`)
          .join('\n');
        parts.push(`**Top products (${data.period})**\n${list || 'No sales data yet.'}`);
      } else if (tool === 'get_low_stock_products') {
        const list = (data.items as Array<{ productName: string; quantityAvailable: number; sku: string }>)
          .map((p) => `- **${p.productName}** (${p.sku}): ${p.quantityAvailable} available`)
          .join('\n');
        parts.push(`**Low stock**\n${list || 'No low-stock items found.'}`);
      } else if (tool === 'get_customer_summary') {
        const top = (data.topCustomers as Array<{ name: string; revenueMinor: number; orderCount: number }>)
          .map((c, i) => `${i + 1}. **${c.name}** — ${formatMoney(c.revenueMinor)} (${c.orderCount} orders)`)
          .join('\n');
        parts.push(
          `**Customers (${data.period})**\n` +
            `- Total: ${data.totalCustomers}\n` +
            `- New: ${data.newCustomers}\n` +
            (top ? `\n**Top customers**\n${top}` : '')
        );
      } else if (tool === 'get_order_metrics') {
        parts.push(
          `**Orders (${data.period})**\n` +
            `- Total: ${data.total}\n` +
            `- Completed: ${data.completed}\n` +
            `- Cancelled: ${data.cancelled}\n` +
            `- Refunded: ${data.refunded} (${formatMoney(data.refundAmountMinor)})`
        );
      } else if (tool === 'get_channel_performance') {
        const list = (data.channels as Array<{ channel: string; revenueMinor: number; sharePercent: number }>)
          .map((c) => `- **${c.channel}**: ${formatMoney(c.revenueMinor)} (${c.sharePercent}%)`)
          .join('\n');
        parts.push(`**Channel performance**\n${list || 'No channel data.'}`);
      } else if (tool === 'get_growth_opportunities') {
        const list = (data.opportunities as Array<{ title: string; detail: string }>)
          .map((o) => `- **${o.title}**: ${o.detail}`)
          .join('\n');
        parts.push(`**Growth opportunities**\n${list || 'No specific opportunities identified.'}`);
      } else if (tool === 'search_products') {
        const list = (data.products as Array<{ name: string; status: string }>)
          .map((p) => `- ${p.name} (${p.status})`)
          .join('\n');
        parts.push(`**Products**\n${list || 'No products found.'}`);
      } else {
        parts.push(`**${tool}**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``);
      }
    } catch {
      parts.push(msg.content);
    }
  }

  return parts.join('\n\n');
}

function formatMoney(minor: number, currency = 'USD') {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

function estimateTokens(messages: Array<{ content: string }>) {
  return messages.reduce((s, m) => s + Math.ceil(m.content.length / 4), 0);
}
