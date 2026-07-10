import type { StorageArea } from "@shared/storage/chromeStorage";

type Listener = Parameters<StorageArea["onChanged"]["addListener"]>[0];

export function createFakeStorageArea(): StorageArea {
  const data: Record<string, unknown> = {};
  const listeners = new Set<Listener>();

  return {
    get: (key) => Promise.resolve({ [key]: data[key] }),
    set: (items) => {
      const changes: Record<string, { newValue?: unknown; oldValue?: unknown }> = {};
      for (const [key, newValue] of Object.entries(items)) {
        changes[key] = { oldValue: data[key], newValue };
        data[key] = newValue;
      }
      listeners.forEach((listener) => {
        listener(changes, "local");
      });
      return Promise.resolve();
    },
    onChanged: {
      addListener: (listener) => {
        listeners.add(listener);
      },
      removeListener: (listener) => {
        listeners.delete(listener);
      },
    },
  };
}
