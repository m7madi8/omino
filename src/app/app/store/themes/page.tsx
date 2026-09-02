import { ensureStoreAccess } from '@/lib/store-admin/access';
import { ThemesLibrary } from '@/components/store-admin/themes-library';

export default async function StoreThemesPage() {
  await ensureStoreAccess();
  return <ThemesLibrary />;
}
