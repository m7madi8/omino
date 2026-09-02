/** Money stored as integer minor units (cents/fils). */

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(amount: number): number {
  return amount / 100;
}

export function formatMoney(
  amountMinor: number,
  currency = 'USD',
  locale = 'en'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(fromMinorUnits(amountMinor));
}

export function parseMoneyInput(value: string): number | null {
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(parsed)) return null;
  return toMinorUnits(parsed);
}
