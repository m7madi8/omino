/**
 * Palestine Mode smoke tests — run: npx tsx scripts/test-palestine-mode.ts
 */
import { resolveMerchantDefaults, isSimpleMode } from '../src/lib/merchant/palestine-mode';
import { resolveMerchantOrderStage, getNextOrderAction } from '../src/lib/merchant/order-status';
import { buildProductShareMessage } from '../src/lib/merchant/whatsapp';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const ps = resolveMerchantDefaults('PS');
assert(ps.locale === 'ar', 'PS locale ar');
assert(ps.merchantExperienceMode === 'simple', 'PS simple mode');
assert(ps.currency === 'ILS', 'PS ILS');

assert(isSimpleMode('simple'), 'simple mode check');
assert(!isSimpleMode('standard'), 'standard mode check');

const stage = resolveMerchantOrderStage({
  status: 'PENDING',
  fulfillmentStatus: 'UNFULFILLED',
  paymentStatus: 'PENDING',
});
assert(stage === 'new', 'pending order is new');
assert(getNextOrderAction(stage) === 'confirm', 'next action confirm');

const msg = buildProductShareMessage({
  productName: 'Test',
  priceFormatted: '₪120',
  productUrl: 'https://example.com/p',
  storeName: 'Shop',
  locale: 'ar',
});
assert(msg.includes('Test'), 'whatsapp message includes product');

console.log('Palestine mode tests passed.');
