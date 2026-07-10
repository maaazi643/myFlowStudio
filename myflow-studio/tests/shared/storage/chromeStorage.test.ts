import { describe, expect, it, vi } from "vitest";
import { defineStorageKey, getValue, setValue, subscribe } from "@shared/storage/chromeStorage";
import { createFakeStorageArea } from "../../mocks/fakeStorageArea";

describe("chromeStorage", () => {
  it("returns the default value when nothing is stored", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");

    await expect(getValue(key, area)).resolves.toBe("system");
  });

  it("returns the stored value once set", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");

    await setValue(key, "dark", area);

    await expect(getValue(key, area)).resolves.toBe("dark");
  });

  it("notifies subscribers of the new value on change", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");
    const callback = vi.fn();

    const unsubscribe = subscribe(key, callback, area);
    await setValue(key, "light", area);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("light");

    unsubscribe();
    await setValue(key, "dark", area);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default value when a change carries no new value", async () => {
    const area = createFakeStorageArea();
    const key = defineStorageKey("theme", "system");
    const callback = vi.fn();

    subscribe(key, callback, area);
    // Simulates chrome.storage.local.remove(key.key), which this module
    // doesn't wrap yet — the change event still carries newValue: undefined.
    await area.set({ [key.key]: undefined });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("system");
  });

  it("keeps independent keys independent", async () => {
    const area = createFakeStorageArea();
    const theme = defineStorageKey("theme", "system");
    const autoDownload = defineStorageKey("autoDownload", true);

    await setValue(theme, "dark", area);

    await expect(getValue(theme, area)).resolves.toBe("dark");
    await expect(getValue(autoDownload, area)).resolves.toBe(true);
  });
});
