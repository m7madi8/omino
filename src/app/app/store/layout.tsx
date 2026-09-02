import { Suspense } from 'react';
import { StoreAdminNav } from '@/components/store-admin/store-admin-nav';

export default function StoreSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <Suspense fallback={<div className="h-10 mb-8 bg-paper rounded-sm animate-pulse" />}>
        <StoreAdminNav />
      </Suspense>
      {children}
    </div>
  );
}
