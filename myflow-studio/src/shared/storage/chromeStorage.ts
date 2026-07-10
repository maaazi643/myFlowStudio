/**
 * Typed wrapper over chrome.storage.local for settings and small metadata
 * only — prompts, projects, images, and logs live in IndexedDB (see
 * ./indexedDb) because they can grow far past what storage.local is meant
 * to hold.
 */

export interface StorageKey<T> {
  key: string;
  defaultValue: T;
}

export function defineStorageKey<T>(key: string, defaultValue: T): StorageKey<T> {
  return { key, defaultValue };
}

type StorageChanges = Record<string, { newValue?: unknown; oldValue?: unknown }>;
type StorageChangeListener = (changes: StorageChanges, areaName: string) => void;

/**
 * The subset of chrome.storage.local (+ the top-level onChanged event) this
 * module actually uses. Narrowing to our own interface — rather than typing
 * against the full ambient `chrome` global — means tests can supply a plain
 * in-memory fake instead of mocking Chrome APIs.
 */
export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  onChanged: {
    addListener(listener: StorageChangeListener): void;
    removeListener(listener: StorageChangeListener): void;
  };
}

function chromeLocalStorageArea(): StorageArea {
  return {
    get: (key) => chrome.storage.local.get(key),
    set: (items) => chrome.storage.local.set(items),
    onChanged: {
      addListener: (listener) => {
        chrome.storage.onChanged.addListener(listener);
      },
      removeListener: (listener) => {
        chrome.storage.onChanged.removeListener(listener);
      },
    },
  };
}

export async function getValue<T>(
  storageKey: StorageKey<T>,
  area: StorageArea = chromeLocalStorageArea(),
): Promise<T> {
  const result = await area.get(storageKey.key);
  const stored = result[storageKey.key];
  return stored === undefined ? storageKey.defaultValue : (stored as T);
}

export async function setValue<T>(
  storageKey: StorageKey<T>,
  value: T,
  area: StorageArea = chromeLocalStorageArea(),
): Promise<void> {
  await area.set({ [storageKey.key]: value });
}

/** Returns an unsubscribe function. */
export function subscribe<T>(
  storageKey: StorageKey<T>,
  callback: (value: T) => void,
  area: StorageArea = chromeLocalStorageArea(),
): () => void {
  function listener(changes: StorageChanges, areaName: string) {
    if (areaName !== "local") {
      return;
    }
    const change = changes[storageKey.key];
    if (!change) {
      return;
    }
    callback(change.newValue === undefined ? storageKey.defaultValue : (change.newValue as T));
  }

  area.onChanged.addListener(listener);
  return () => {
    area.onChanged.removeListener(listener);
  };
}
