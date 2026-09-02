import type { StoreExperienceConfig } from '@/types/store-experience';

export type StoreHealthCheck = {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  hint?: string;
};

export type StoreHealthReport = {
  score: number;
  checks: StoreHealthCheck[];
  status: 'ready' | 'needs-work' | 'not-ready';
};

type HealthInput = {
  storeName: string;
  storeStatus: string;
  logoUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  productCount: number;
  productsWithImages: number;
  categoryCount: number;
  shippingMethodCount: number;
  experience: StoreExperienceConfig;
};

export function computeStoreHealth(input: HealthInput): StoreHealthReport {
  const checks: StoreHealthCheck[] = [
    {
      id: 'active',
      label: 'Store is active',
      passed: input.storeStatus === 'ACTIVE',
      weight: 15,
      hint: 'Set status to Active when ready to sell',
    },
    {
      id: 'logo',
      label: 'Logo uploaded',
      passed: Boolean(input.logoUrl),
      weight: 10,
      hint: 'Add a logo for brand recognition',
    },
    {
      id: 'description',
      label: 'Store description',
      passed: Boolean(input.description?.trim()),
      weight: 8,
      hint: 'Describe your brand for customers',
    },
    {
      id: 'hero',
      label: 'Hero section configured',
      passed:
        input.experience.hero.enabled &&
        Boolean(input.experience.hero.title?.trim() || input.experience.hero.imageUrl),
      weight: 12,
      hint: 'Enable hero with headline or image',
    },
    {
      id: 'products',
      label: 'Active products',
      passed: input.productCount > 0,
      weight: 20,
      hint: 'Add at least one product',
    },
    {
      id: 'product-images',
      label: 'Products have images',
      passed: input.productCount > 0 && input.productsWithImages >= input.productCount * 0.5,
      weight: 12,
      hint: 'Add images to at least half your products',
    },
    {
      id: 'contact',
      label: 'Contact information',
      passed: Boolean(input.contactEmail || input.contactPhone),
      weight: 8,
      hint: 'Add email or phone for customer trust',
    },
    {
      id: 'shipping',
      label: 'Shipping methods',
      passed: input.shippingMethodCount > 0,
      weight: 10,
      hint: 'Configure shipping for checkout',
    },
    {
      id: 'seo',
      label: 'SEO basics',
      passed: Boolean(
        input.experience.seo.title?.trim() || input.experience.seo.description?.trim()
      ),
      weight: 5,
      hint: 'Custom title or description improves discovery',
    },
  ];

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  const score = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;

  let status: StoreHealthReport['status'] = 'not-ready';
  if (score >= 80) status = 'ready';
  else if (score >= 50) status = 'needs-work';

  return { score, checks, status };
}
