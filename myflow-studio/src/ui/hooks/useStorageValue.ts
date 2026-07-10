import { useMemo, useSyncExternalStore } from "react";
import { createStorageStore } from "@shared/storage/createStorageStore";
import type { StorageKey } from "@shared/storage/chromeStorage";

export function useStorageValue<T>(storageKey: StorageKey<T>): [T, (value: T) => void] {
  const store = useMemo(() => createStorageStore(storageKey), [storageKey]);
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot);

  function setValue(next: T): void {
    void store.setValue(next);
  }

  return [value, setValue];
}
