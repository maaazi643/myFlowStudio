import {
  getValue,
  setValue as setStoredValue,
  subscribe as subscribeToArea,
} from "./chromeStorage";
import type { StorageArea, StorageKey } from "./chromeStorage";

/**
 * Adapts a chrome.storage-backed key to React's useSyncExternalStore
 * contract. chrome.storage.get is async, but getSnapshot must be
 * synchronous — so this keeps an in-memory cache seeded with the key's
 * default value, kicks off one async read to populate it on first
 * subscribe, and re-renders once that resolves. chrome.storage.onChanged
 * keeps it live after that (including changes from other extension
 * contexts). This — plus the storage layer already being the source of
 * truth — is what replaces a Redux/Zustand-style store.
 */
export interface StorageStore<T> {
  getSnapshot: () => T;
  subscribe: (onStoreChange: () => void) => () => void;
  setValue: (value: T) => Promise<void>;
}

export function createStorageStore<T>(
  storageKey: StorageKey<T>,
  area?: StorageArea,
): StorageStore<T> {
  let cache: T = storageKey.defaultValue;
  let initialized = false;
  // Bumped on every write we know about (our own, or a real onChanged
  // event) so a slow initial read can detect it's been superseded and
  // avoid clobbering a newer value with a stale one.
  let generation = 0;
  const listeners = new Set<() => void>();

  function notify(): void {
    listeners.forEach((listener) => {
      listener();
    });
  }

  function ensureInitialized(): void {
    if (initialized) {
      return;
    }
    initialized = true;
    const generationAtStart = generation;
    void getValue(storageKey, area).then((value) => {
      if (generation !== generationAtStart) {
        return;
      }
      cache = value;
      notify();
    });
  }

  return {
    getSnapshot: () => {
      ensureInitialized();
      return cache;
    },
    subscribe: (onStoreChange) => {
      ensureInitialized();
      listeners.add(onStoreChange);
      const unsubscribeFromArea = subscribeToArea(
        storageKey,
        (value) => {
          generation += 1;
          cache = value;
          onStoreChange();
        },
        area,
      );
      return () => {
        listeners.delete(onStoreChange);
        unsubscribeFromArea();
      };
    },
    setValue: (value) => {
      generation += 1;
      cache = value;
      return setStoredValue(storageKey, value, area);
    },
  };
}
