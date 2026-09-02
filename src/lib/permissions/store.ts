export const STORE_PERMISSIONS = [
  'store.read',
  'store.write',
  'store.manage',
] as const;

export type StorePermissionKey = (typeof STORE_PERMISSIONS)[number];
