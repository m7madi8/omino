import type { MerchantLocale } from '@/lib/merchant/palestine-mode';

export function buildProductShareMessage(input: {
  productName: string;
  priceFormatted: string;
  productUrl: string;
  storeName: string;
  locale: MerchantLocale;
}): string {
  if (input.locale === 'ar') {
    return `مرحبًا 👋\n\nشوف هذا المنتج من متجر ${input.storeName}:\n\n${input.productName}\n${input.priceFormatted}\n\n${input.productUrl}`;
  }
  return `Hi 👋\n\nCheck out this product from ${input.storeName}:\n\n${input.productName}\n${input.priceFormatted}\n\n${input.productUrl}`;
}

export function buildStoreShareMessage(input: {
  storeName: string;
  storeUrl: string;
  locale: MerchantLocale;
}): string {
  if (input.locale === 'ar') {
    return `مرحبًا 👋\n\nتفضل زيارة متجر ${input.storeName}:\n\n${input.storeUrl}`;
  }
  return `Hi 👋\n\nVisit ${input.storeName}:\n\n${input.storeUrl}`;
}

export function buildOrderNotifyMessage(input: {
  customerName: string;
  orderNumber: string;
  storeName: string;
  locale: MerchantLocale;
}): string {
  if (input.locale === 'ar') {
    return `مرحبًا ${input.customerName} 👋\n\nتم استلام طلبك #${input.orderNumber} من ${input.storeName}.\nسنتواصل معك قريبًا للتأكيد.`;
  }
  return `Hi ${input.customerName},\n\nWe received your order #${input.orderNumber} from ${input.storeName}. We'll confirm shortly.`;
}

export function openWhatsAppShare(phone: string | null | undefined, message: string) {
  const encoded = encodeURIComponent(message);
  const url = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function getStorefrontProductUrl(publicSlug: string, productSlug: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/store/${publicSlug}/products/${productSlug}`;
  }
  return `/store/${publicSlug}/products/${productSlug}`;
}

export function getStorefrontUrl(publicSlug: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/store/${publicSlug}`;
  }
  return `/store/${publicSlug}`;
}
