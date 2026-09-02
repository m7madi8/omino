import type { BarcodeType, ProductCatalogKind, ProductStatus, ProductType, StockMovementType } from '@/types/prisma-enums';

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  productType: ProductType;
  brand: string | null;
  categoryName: string | null;
  sku: string;
  sellingPrice: number;
  currency: string;
  totalOnHand: number;
  totalAvailable: number;
  isLowStock: boolean;
  imageUrl: string | null;
  variantCount: number;
  updatedAt: string;
};

export type VariantSummary = {
  id: string;
  sku: string;
  name: string | null;
  barcode: string | null;
  barcodeType: BarcodeType | null;
  sellingPrice: number;
  costPrice: number | null;
  compareAtPrice: number | null;
  currency: string;
  status: ProductStatus;
  isDefault: boolean;
  optionLabels: string[];
  totalOnHand: number;
  totalAvailable: number;
  totalReserved: number;
  isLowStock: boolean;
};

export type InventoryListItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string | null;
  sku: string;
  stockLocationId: string;
  stockLocationName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityIncoming: number;
  lowStockThreshold: number | null;
  isLowStock: boolean;
};

export type StockMovementRecord = {
  id: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  stockLocationName: string;
  userName: string | null;
  createdAt: string;
};

export type CreateProductInput = {
  name: string;
  description?: string;
  productType?: ProductType;
  catalogKind?: ProductCatalogKind;
  isFeatured?: boolean;
  brand?: string;
  categoryId?: string;
  storeId?: string;
  status?: ProductStatus;
  trackInventory?: boolean;
  costPrice?: number;
  sellingPrice: number;
  compareAtPrice?: number;
  currency?: string;
  sku?: string;
  barcode?: string;
  barcodeType?: BarcodeType;
  lowStockThreshold?: number;
  reorderPoint?: number;
  initialStock?: number;
  stockLocationId?: string;
  images?: { url: string; altText?: string; isPrimary?: boolean }[];
  variants?: {
    sku?: string;
    name?: string;
    sellingPrice: number;
    costPrice?: number;
    compareAtPrice?: number;
    barcode?: string;
    barcodeType?: BarcodeType;
    optionValues?: string[];
    initialStock?: number;
    lowStockThreshold?: number;
  }[];
  options?: { name: string; values: string[] }[];
  bundleItems?: { productId: string; quantity: number }[];
};
