export const SYSTEM_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] as const;
export type SystemRoleSlug = (typeof SYSTEM_ROLES)[number];

import { POS_PERMISSIONS } from '@/lib/permissions/pos';
import { STORE_PERMISSIONS } from '@/lib/permissions/store';

export const PERMISSIONS = [
  'products.read',
  'products.write',
  'inventory.read',
  'inventory.write',
  'orders.read',
  'orders.write',
  'orders.cancel',
  'orders.refund',
  'customers.read',
  'customers.write',
  'customers.delete',
  'customers.manage_tags',
  'customers.manage_notes',
  'customers.export',
  'payments.read',
  'payments.write',
  'payments.refund',
  ...POS_PERMISSIONS,
  ...STORE_PERMISSIONS,
  'analytics.read',
  'settings.read',
  'settings.write',
  'team.read',
  'team.write',
  'ai.use',
  'ai.execute',
  'automations.read',
  'automations.write',
  'automations.activate',
  'automations.pause',
  'automations.execute',
  'automations.delete',
  'automations.view_executions',
  'marketing.read',
  'marketing.write',
  'marketing.create_campaign',
  'marketing.activate_campaign',
  'marketing.pause_campaign',
  'marketing.manage_audiences',
  'marketing.manage_promotions',
  'marketing.view_analytics',
  'marketing.export',
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSION_MAP: Record<SystemRoleSlug, PermissionKey[]> = {
  OWNER: [...PERMISSIONS],
  ADMIN: PERMISSIONS.filter((p) => p !== 'settings.write' || true).filter(
    (p) => !p.startsWith('ai.execute') || true
  ) as PermissionKey[],
  MANAGER: [
    'products.read',
    'products.write',
    'inventory.read',
    'inventory.write',
    'orders.read',
    'orders.write',
    'orders.cancel',
    'orders.refund',
    'customers.read',
    'customers.write',
    'customers.delete',
    'customers.manage_tags',
    'customers.manage_notes',
    'customers.export',
    'payments.read',
    'payments.write',
    'payments.refund',
    'pos.read',
    'pos.sell',
    'pos.manage_sessions',
    'pos.void',
    'pos.refund',
    'store.read',
    'store.write',
    'analytics.read',
    'settings.read',
    'team.read',
    'ai.use',
    'automations.read',
    'automations.write',
    'automations.activate',
    'automations.pause',
    'automations.view_executions',
    'marketing.read',
    'marketing.write',
    'marketing.create_campaign',
    'marketing.activate_campaign',
    'marketing.pause_campaign',
    'marketing.manage_audiences',
    'marketing.manage_promotions',
    'marketing.view_analytics',
    'marketing.export',
  ],
  STAFF: [
    'products.read',
    'inventory.read',
    'orders.read',
    'orders.write',
    'customers.read',
    'customers.write',
    'payments.read',
    'payments.write',
    'pos.read',
    'pos.sell',
    'store.read',
    'ai.use',
  ],
};

// ADMIN gets all except destructive settings — simplify: all except ai.execute for demo
ROLE_PERMISSION_MAP.ADMIN = PERMISSIONS.filter((p) => p !== 'ai.execute') as PermissionKey[];

export const MODULE_NAV = [
  { slug: 'overview', label: 'Overview', labelKey: 'nav.overview', href: '/app', permission: null },
  { slug: 'pos', label: 'POS', labelKey: 'nav.pos', href: '/app/pos', permission: 'pos.sell' as PermissionKey },
  { slug: 'store', label: 'Store', labelKey: 'nav.store', href: '/app/store', permission: 'store.read' as PermissionKey },
  { slug: 'products', label: 'Products', labelKey: 'nav.products', href: '/app/products', permission: 'products.read' as PermissionKey },
  { slug: 'collections', label: 'Collections', labelKey: 'nav.collections', href: '/app/collections', permission: 'products.read' as PermissionKey },
  { slug: 'inventory', label: 'Inventory', labelKey: 'nav.inventory', href: '/app/inventory', permission: 'inventory.read' as PermissionKey },
  { slug: 'orders', label: 'Orders', labelKey: 'nav.orders', href: '/app/orders', permission: 'orders.read' as PermissionKey },
  { slug: 'customers', label: 'Customers', labelKey: 'nav.customers', href: '/app/customers', permission: 'customers.read' as PermissionKey },
  { slug: 'payments', label: 'Payments', labelKey: 'nav.payments', href: '/app/payments', permission: 'payments.read' as PermissionKey },
  { slug: 'analytics', label: 'Analytics', labelKey: 'nav.analytics', href: '/app/analytics', permission: 'analytics.read' as PermissionKey },
  { slug: 'ai', label: 'AI', labelKey: 'nav.ai', href: '/app/ai', permission: 'ai.use' as PermissionKey },
  { slug: 'automations', label: 'Automations', labelKey: 'nav.automations', href: '/app/automations', permission: 'automations.read' as PermissionKey },
  { slug: 'marketing', label: 'Marketing', labelKey: 'nav.marketing', href: '/app/marketing', permission: 'marketing.read' as PermissionKey },
  { slug: 'team', label: 'Team', labelKey: 'nav.team', href: '/app/team', permission: 'team.read' as PermissionKey },
  { slug: 'settings', label: 'Settings', labelKey: 'nav.settings', href: '/app/settings', permission: 'settings.read' as PermissionKey },
] as const;

export const BUSINESS_TYPES = [
  'retail',
  'restaurant',
  'services',
  'ecommerce',
  'wholesale',
  'other',
] as const;

export const CURRENCIES = [
  { code: 'ILS', label: 'Israeli Shekel (₪)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'JOD', label: 'Jordanian Dinar (JD)' },
] as const;

export { COUNTRIES } from '@/lib/geo/allowed-countries';
