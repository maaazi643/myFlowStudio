const DB_NAME = "myflow-studio";
const DB_VERSION = 1;

export const STORES = {
  prompts: "prompts",
  projects: "projects",
  images: "images",
  logs: "logs",
} as const;

/**
 * Version history — add a new branch keyed on `event.oldVersion` here when
 * a future milestone needs a schema change, rather than rewriting this
 * function. There's only ever been one version so far.
 */
function upgrade(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(STORES.prompts)) {
    const prompts = db.createObjectStore(STORES.prompts, { keyPath: "id" });
    prompts.createIndex("projectId", "projectId");
    prompts.createIndex("createdAt", "createdAt");
  }

  if (!db.objectStoreNames.contains(STORES.projects)) {
    db.createObjectStore(STORES.projects, { keyPath: "id" });
  }

  if (!db.objectStoreNames.contains(STORES.images)) {
    const images = db.createObjectStore(STORES.images, { keyPath: "id" });
    images.createIndex("projectId", "projectId");
    images.createIndex("promptId", "promptId");
    images.createIndex("kind", "kind");
  }

  if (!db.objectStoreNames.contains(STORES.logs)) {
    const logs = db.createObjectStore(STORES.logs, { keyPath: "id" });
    logs.createIndex("createdAt", "createdAt");
  }
}

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      upgrade(request.result);
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    request.onerror = () => {
      reject(new Error(request.error?.message ?? "Failed to open the MyFlow Studio database."));
    };
  });
  return dbPromise;
}

export function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(new Error(request.error?.message ?? "IndexedDB request failed."));
    };
  });
}

/**
 * Test-only: closes the current connection (IndexedDB blocks deletion while
 * any connection is open) and forces the next openDatabase() call to open a
 * fresh one.
 */
export function resetDatabaseConnectionForTests(): void {
  dbInstance?.close();
  dbInstance = null;
  dbPromise = null;
}
