import type { DiscountType } from '@prisma/client';

export type CartTotalsInput = {
  items: { quantity: number; unitPriceMinor: number; discountAmount?: number }[];
  discountType?: DiscountType | null;
  discountValue?: number | null;
  taxRateBps?: number;
};

export type CartTotals = {
  subtotalMinor: number;
  discountAmount: number;
  taxAmount: number;
  totalMinor: number;
};

export function calculateCartTotals(input: CartTotalsInput): CartTotals {
  const subtotalMinor = input.items.reduce((sum, item) => {
    const line = item.quantity * item.unitPriceMinor - (item.discountAmount ?? 0);
    return sum + Math.max(0, line);
  }, 0);

  let discountAmount = 0;
  if (input.discountType === 'PERCENT' && input.discountValue != null) {
    discountAmount = Math.round((subtotalMinor * input.discountValue) / 10000);
  } else if (input.discountType === 'FIXED' && input.discountValue != null) {
    discountAmount = input.discountValue;
  }
  discountAmount = Math.min(discountAmount, subtotalMinor);

  const taxable = subtotalMinor - discountAmount;
  const taxRateBps = input.taxRateBps ?? 0;
  const taxAmount = Math.round((taxable * taxRateBps) / 10000);
  const totalMinor = taxable + taxAmount;

  return { subtotalMinor, discountAmount, taxAmount, totalMinor };
}

export async function nextOrderNumber(
  organizationId: string,
  tx: { order: { count: (args: { where: { organizationId: string } }) => Promise<number> } }
): Promise<string> {
  const count = await tx.order.count({ where: { organizationId } });
  const seq = count + 1;
  return `POS-${String(seq).padStart(6, '0')}`;
}
