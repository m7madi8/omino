export type StorefrontCartItem = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
  available: number;
  imageUrl?: string | null;
  catalogKind?: 'SIMPLE' | 'BUNDLE';
  bundleItems?: { name: string; quantity: number; slug: string }[];
};

export type StorefrontStore = {
  id: string;
  name: string;
  publicSlug: string;
  description: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  currency: string;
  country: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'MAINTENANCE';
  primaryColor: string | null;
  secondaryColor: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: import('@/types/store-contact').StoreSocialLinks;
  contactLinks: import('@/types/store-contact').ResolvedContactLink[];
  hero: import('@/types/store-theme').StoreHeroConfig;
  experience: import('@/types/store-experience').StoreExperienceConfig;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
};

export type StorefrontProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  secondaryImageUrl: string | null;
  defaultVariantId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  catalogKind: 'SIMPLE' | 'BUNDLE';
  isFeatured: boolean;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  available: number;
  inStock: boolean;
  variantCount: number;
};

export type StorefrontVariant = {
  id: string;
  name: string | null;
  sku: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  available: number;
  inStock: boolean;
  optionValues: { option: string; value: string }[];
};

export type StorefrontProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  catalogKind: 'SIMPLE' | 'BUNDLE';
  images: { url: string; alt: string | null }[];
  options: { name: string; values: string[] }[];
  variants: StorefrontVariant[];
  bundleItems: {
    productId: string;
    name: string;
    slug: string;
    quantity: number;
  }[];
};

export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};

export type StorefrontCart = {
  id: string;
  currency: string;
  subtotalMinor: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalMinor: number;
  itemCount: number;
  couponCode?: string | null;
  items: StorefrontCartItem[];
};

export type ShippingMethodView = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMinor: number;
  estimatedDelivery: string | null;
};

export type CheckoutInput = {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  country: string;
  notes?: string;
  shippingMethodId: string;
  paymentMethod: 'COD';
  idempotencyKey: string;
};

export type PublicOrderView = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotalMinor: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalMinor: number;
  customerName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  shippingAddress: Record<string, string> | null;
  paymentMethod: string;
  createdAt: string;
  items: {
    productName: string;
    variantName: string | null;
    sku: string;
    quantity: number;
    unitPriceMinor: number;
    subtotalMinor: number;
  }[];
};
