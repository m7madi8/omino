const DB_NAME = 'omino-pos-offline';
const PRODUCTS_STORE = 'products';
const QUEUE_STORE = 'pending-transactions';

type CachedProduct = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  updatedAt: number;
};

type PendingTransaction = {
  id: string;
  idempotencyKey: string;
  payload: unknown;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        db.createObjectStore(PRODUCTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cachePosProducts(products: CachedProduct[]) {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  const tx = db.transaction(PRODUCTS_STORE, 'readwrite');
  const store = tx.objectStore(PRODUCTS_STORE);
  for (const p of products) store.put(p);
}

export async function getCachedPosProducts(): Promise<CachedProduct[]> {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PRODUCTS_STORE, 'readonly');
    const req = tx.objectStore(PRODUCTS_STORE).getAll();
    req.onsuccess = () => resolve(req.result as CachedProduct[]);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueOfflineTransaction(input: {
  idempotencyKey: string;
  payload: unknown;
}) {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  tx.objectStore(QUEUE_STORE).put({
    id: input.idempotencyKey,
    idempotencyKey: input.idempotencyKey,
    payload: input.payload,
    createdAt: Date.now(),
  } satisfies PendingTransaction);
}

export async function listPendingTransactions(): Promise<PendingTransaction[]> {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result as PendingTransaction[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removePendingTransaction(id: string) {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  tx.objectStore(QUEUE_STORE).delete(id);
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
