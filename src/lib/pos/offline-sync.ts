import {
  enqueueOfflineTransaction,
  isOnline,
  listPendingTransactions,
  removePendingTransaction,
} from '@/lib/pos/offline-queue';

export async function syncOfflineQueue(
  submit: (payload: unknown, idempotencyKey: string) => Promise<boolean>
) {
  if (!isOnline()) return { synced: 0, failed: 0 };

  const pending = await listPendingTransactions();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const ok = await submit(item.payload, item.idempotencyKey);
      if (ok) {
        await removePendingTransaction(item.id);
        synced += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}

export function registerOfflineSync(
  submit: (payload: unknown, idempotencyKey: string) => Promise<boolean>
) {
  if (typeof window === 'undefined') return () => {};

  const run = () => {
    void syncOfflineQueue(submit);
  };

  window.addEventListener('online', run);
  run();

  return () => window.removeEventListener('online', run);
}

export { enqueueOfflineTransaction, isOnline };
