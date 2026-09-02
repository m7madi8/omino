export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type ProductType = 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
export type ProductCatalogKind = 'SIMPLE' | 'BUNDLE';
export type BarcodeType = 'EAN' | 'UPC' | 'GTIN' | 'INTERNAL';
export type StockMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'DAMAGE'
  | 'INITIAL'
  | 'RESERVATION'
  | 'RELEASE';

export type OrderSource = 'POS' | 'ONLINE';
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';
export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'CANCELLED';
export type FulfillmentStatus =
  | 'UNFULFILLED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'OTHER' | 'COD';
export type CartChannel = 'POS' | 'ONLINE';
export type StoreStatus = 'ACTIVE' | 'PAUSED' | 'MAINTENANCE';
export type AdjustmentType = 'DISCOUNT' | 'TAX' | 'SHIPPING' | 'FEE';
export type RefundStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type CartStatus = 'ACTIVE' | 'HELD' | 'COMPLETED' | 'CANCELLED';
export type DiscountType = 'PERCENT' | 'FIXED';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CustomerSource = 'POS' | 'ONLINE_STORE' | 'MANUAL' | 'IMPORT' | 'API';
export type CustomerAddressType = 'SHIPPING' | 'BILLING' | 'OTHER';
