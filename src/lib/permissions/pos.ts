export const POS_PERMISSIONS = [
  'pos.read',
  'pos.sell',
  'pos.void',
  'pos.refund',
  'pos.manage_sessions',
] as const;

export type PosPermissionKey = (typeof POS_PERMISSIONS)[number];
