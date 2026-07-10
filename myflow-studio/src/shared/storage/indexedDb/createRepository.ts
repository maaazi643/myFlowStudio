import { openDatabase, promisifyRequest } from "./db";

export interface Entity {
  id: string;
}

export interface Repository<T extends Entity> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  put(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

/**
 * Shared CRUD surface for every store — prompts, projects, images, and logs
 * all need the same get/put/delete shape, so it lives here once. Each
 * store's repository adds only its own indexed-query methods on top.
 */
export function createRepository<T extends Entity>(storeName: string): Repository<T> {
  async function withStore<R>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<R>,
  ): Promise<R> {
    const db = await openDatabase();
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    return promisifyRequest(run(store));
  }

  return {
    getAll: () => withStore<T[]>("readonly", (store) => store.getAll() as IDBRequest<T[]>),
    getById: (id) =>
      withStore<T | undefined>("readonly", (store) => store.get(id) as IDBRequest<T | undefined>),
    put: async (entity) => {
      await withStore("readwrite", (store) => store.put(entity));
    },
    delete: async (id) => {
      await withStore("readwrite", (store) => store.delete(id));
    },
    count: () => withStore("readonly", (store) => store.count()),
  };
}

export async function getAllByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey,
): Promise<T[]> {
  const db = await openDatabase();
  const tx = db.transaction(storeName, "readonly");
  const index = tx.objectStore(storeName).index(indexName);
  return promisifyRequest(index.getAll(value) as IDBRequest<T[]>);
}
