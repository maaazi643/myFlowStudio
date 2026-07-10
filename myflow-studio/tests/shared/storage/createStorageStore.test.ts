import { describe, expect, it, vi } from "vitest";
import { createStorageStore } from "@shared/storage/createStorageStore";
import { defineStorageKey, setValue } from "@shared/storage/chromeStorage";
import { createFakeStorageArea } from "../../mocks/fakeStorageArea";

describe("createStorageStore", () => {
  it("returns the default value synchronously before the async read resolves", () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");
    const store = createStorageStore(key, area);

    expect(store.getSnapshot()).toBe("system");
  });

  it("updates the snapshot once the initial async read resolves, and notifies subscribers", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");
    await setValue(key, "dark", area);
    const store = createStorageStore(key, area);
    const listener = vi.fn();

    store.subscribe(listener);
    // Flush the microtask queue so the initial getValue() read resolves.
    await Promise.resolve();
    await Promise.resolve();

    expect(store.getSnapshot()).toBe("dark");
    expect(listener).toHaveBeenCalled();
  });

  it("notifies subscribers when the underlying storage changes externally", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");
    const store = createStorageStore(key, area);
    const listener = vi.fn();
    store.subscribe(listener);
    await Promise.resolve();
    await Promise.resolve();
    listener.mockClear();

    await setValue(key, "light", area);

    expect(store.getSnapshot()).toBe("light");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not let a slow initial read clobber a newer value that arrived while it was in flight", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");
    const store = createStorageStore(key, area);

    // Nothing awaited yet — the initial getValue() read is still pending.
    store.subscribe(vi.fn());
    await setValue(key, "light", area);
    // Now let the (stale) initial read's .then() callback run, if it hasn't already.
    await Promise.resolve();
    await Promise.resolve();

    expect(store.getSnapshot()).toBe("light");
  });

  it("setValue updates the snapshot optimistically and persists to the area", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");
    const store = createStorageStore(key, area);

    await store.setValue("dark");

    expect(store.getSnapshot()).toBe("dark");
    const persisted = await area.get(key.key);
    expect(persisted[key.key]).toBe("dark");
  });

  it("stops notifying an unsubscribed listener", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");
    const store = createStorageStore(key, area);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    await Promise.resolve();
    listener.mockClear();

    unsubscribe();
    await setValue(key, "light", area);

    expect(listener).not.toHaveBeenCalled();
  });

  it("only performs one initial read even with multiple getSnapshot calls before it resolves", async () => {
    const area = createFakeStorageArea();
    const getSpy = vi.spyOn(area, "get");
    const key = defineStorageKey("theme", "system");
    const store = createStorageStore(key, area);

    store.getSnapshot();
    store.getSnapshot();
    store.getSnapshot();
    await Promise.resolve();
    await Promise.resolve();

    expect(getSpy).toHaveBeenCalledTimes(1);
  });
});
