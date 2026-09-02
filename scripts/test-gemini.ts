/**
 * Gemini provider integration tests
 * Run: npm run test:gemini
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getAiConfig, isAiConfigured } from '../src/lib/ai/config';
import { getAIProvider, resetAIProviderCache } from '../src/server/ai/providers';
import { GeminiProvider } from '../src/server/ai/providers/gemini-provider';
import { OMINO_CORE_INSTRUCTIONS } from '../src/lib/ai/system-instructions';
import { parseStructuredResponse } from '../src/lib/ai/structured-response';
import { TOOL_DEFINITIONS } from '../src/server/ai/tools/registry';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

function testConfig() {
  console.log('\nConfiguration');
  const original = { ...process.env };

  process.env.AI_PROVIDER = 'gemini';
  delete process.env.GEMINI_API_KEY;
  resetAIProviderCache();
  assert(getAiConfig().provider === 'mock', 'falls back to mock without GEMINI_API_KEY');

  process.env.GEMINI_API_KEY = 'test-key';
  resetAIProviderCache();
  assert(getAiConfig().provider === 'gemini', 'uses gemini when key present');
  assert(getAiConfig().model.includes('gemini'), 'default model is gemini flash family');

  process.env.AI_MODEL = 'gemini-2.5-flash';
  assert(getAiConfig().model === 'gemini-2.5-flash', 'respects AI_MODEL override');

  Object.assign(process.env, original);
  if (!original.GEMINI_API_KEY) delete process.env.GEMINI_API_KEY;
  if (!original.AI_PROVIDER) delete process.env.AI_PROVIDER;
  resetAIProviderCache();
}

function testProviderFactory() {
  console.log('\nProvider Factory');
  const original = { ...process.env };

  process.env.AI_PROVIDER = 'gemini';
  process.env.GEMINI_API_KEY = 'test-key';
  resetAIProviderCache();

  const provider = getAIProvider();
  assert(provider instanceof GeminiProvider, 'getAIProvider returns GeminiProvider');
  assert(provider.name === 'gemini', 'provider name is gemini');

  Object.assign(process.env, original);
  if (!original.GEMINI_API_KEY) delete process.env.GEMINI_API_KEY;
  if (!original.AI_PROVIDER) delete process.env.AI_PROVIDER;
}

function testSystemInstructions() {
  console.log('\nSystem Instructions');
  assert(OMINO_CORE_INSTRUCTIONS.includes('OMINO Intelligence'), 'defines OMINO identity');
  assert(OMINO_CORE_INSTRUCTIONS.includes('Never invent'), 'forbids invented metrics');
  assert(OMINO_CORE_INSTRUCTIONS.includes('Never directly access'), 'forbids direct DB access');
}

function testStructuredResponse() {
  console.log('\nStructured Responses');
  const plain = parseStructuredResponse('Your revenue is up 12%.');
  assert(plain === null, 'plain text returns null');

  const structured = parseStructuredResponse(
    JSON.stringify({
      type: 'insight',
      summary: 'Sales increased',
      severity: 'positive',
    })
  );
  assert(structured?.type === 'insight', 'parses structured JSON responses');
}

function testSecurityNoClientExposure() {
  console.log('\nSecurity');
  const srcDir = join(process.cwd(), 'src');
  const violations: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry !== 'node_modules') walk(full);
      } else if (/\.(ts|tsx)$/.test(entry)) {
        const content = readFileSync(full, 'utf-8');
        if (content.includes('NEXT_PUBLIC_GEMINI')) {
          violations.push(full);
        }
        if (content.includes('@google/genai') && entry.endsWith('.tsx') && !full.includes('api/')) {
          const isClient = content.includes("'use client'") || content.includes('"use client"');
          if (isClient) violations.push(full);
        }
      }
    }
  }

  walk(srcDir);
  assert(violations.length === 0, 'no Gemini SDK or NEXT_PUBLIC_GEMINI in client code');
  assert(!isAiConfigured() || process.env.GEMINI_API_KEY !== undefined || getAiConfig().provider !== 'gemini', 'isAiConfigured respects gemini key');
}

async function testGeminiLiveConnection() {
  console.log('\nLive Gemini Connection (optional)');
  if (!process.env.GEMINI_API_KEY) {
    console.log('  ⊘ Skipped — no GEMINI_API_KEY');
    return;
  }

  process.env.AI_PROVIDER = 'gemini';
  resetAIProviderCache();

  const provider = new GeminiProvider();
  const tools = TOOL_DEFINITIONS.filter((t) => t.name === 'get_sales_summary');

  try {
    const result = await provider.generate({
      messages: [
        {
          role: 'user',
          content: 'How are my sales this month? Use the get_sales_summary tool.',
        },
      ],
      tools,
      maxTokens: 512,
    });

    assert(
      result.finishReason === 'tool_calls' || result.content.length > 0,
      'gemini responds with tool call or text'
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'AI_AUTH_ERROR' || msg === 'AI_PROVIDER_ERROR') {
      console.log('  ⊘ Skipped — GEMINI_API_KEY invalid or API unavailable');
    } else {
      assert(false, `unexpected error: ${msg}`);
    }
  }
}

async function main() {
  console.log('OMINO Gemini Integration Tests\n==============================');

  testConfig();
  testProviderFactory();
  testSystemInstructions();
  testStructuredResponse();
  testSecurityNoClientExposure();
  await testGeminiLiveConnection();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
