const DB_NAME = "myflow-studio";
const DB_VERSION = 2;

export const STORES = {
  prompts: "prompts",
  projects: "projects",
  images: "images",
  logs: "logs",
  queueRuns: "queueRuns",
} as const;

function upgradeToV1(db: IDBDatabase): void {
  const prompts = db.createObjectStore(STORES.prompts, { keyPath: "id" });
  prompts.createIndex("projectId", "projectId");
  prompts.createIndex("createdAt", "createdAt");

  db.createObjectStore(STORES.projects, { keyPath: "id" });

  const images = db.createObjectStore(STORES.images, { keyPath: "id" });
  images.createIndex("projectId", "projectId");
  images.createIndex("promptId", "promptId");
  images.createIndex("kind", "kind");

  const logs = db.createObjectStore(STORES.logs, { keyPath: "id" });
  logs.createIndex("createdAt", "createdAt");
}

function upgradeToV2(db: IDBDatabase): void {
  const queueRuns = db.createObjectStore(STORES.queueRuns, { keyPath: "id" });
  queueRuns.createIndex("status", "status");
  queueRuns.createIndex("updatedAt", "updatedAt");
}

/** Version history — each past version's branch stays as-is; only add new ones. */
function upgrade(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 1) {
    upgradeToV1(db);
  }
  if (oldVersion < 2) {
    upgradeToV2(db);
  }
}

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      upgrade(request.result, event.oldVersion);
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
