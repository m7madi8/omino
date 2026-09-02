import type {
  CustomerSource,
  CustomerStatus,
  CustomerAddressType,
} from '@/types/prisma-enums';

export type CustomerListItem = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  source: CustomerSource;
  orderCount: number;
  totalSpentMinor: number;
  lastOrderAt: string | null;
  tags: { id: string; name: string; slug: string }[];
  createdAt: string;
};

export type CustomerMetrics = {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenueMinor: number;
  refundedMinor: number;
  netRevenueMinor: number;
  averageOrderValueMinor: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
};

export type CustomerDetail = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  source: CustomerSource;
  notes: string | null;
  isWalkIn: boolean;
  metrics: CustomerMetrics;
  tags: { id: string; name: string; slug: string; color: string | null }[];
  addresses: CustomerAddressView[];
  recentOrders: CustomerOrderSummary[];
  recentNotes: CustomerNoteView[];
  timeline: CustomerTimelineEvent[];
  createdAt: string;
  updatedAt: string;
};

export type CustomerAddressView = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  type: CustomerAddressType;
  isDefault: boolean;
};

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalMinor: number;
  currency: string;
  source: string;
  createdAt: string;
};

export type CustomerNoteView = {
  id: string;
  content: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerTimelineEvent = {
  id: string;
  eventType: string;
  source: string | null;
  userName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type CustomerMatch = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  matchReason: 'email' | 'phone' | 'name';
};

export type CustomerContext = {
  profile: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    status: CustomerStatus;
    source: CustomerSource;
    tags: string[];
  };
  metrics: CustomerMetrics;
  recentOrders: CustomerOrderSummary[];
  activitySummary: {
    lastOrderAt: string | null;
    orderCount: number;
    netRevenueMinor: number;
  };
};
