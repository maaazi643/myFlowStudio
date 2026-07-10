import { describe, expect, it } from "vitest";
import {
  buildProjectBundle,
  isProjectBundleFile,
  parseProjectBundle,
  PROJECT_BUNDLE_FORMAT_VERSION,
} from "@shared/utils/projectBundle";
import { DEFAULT_GENERATION_SETTINGS } from "@shared/storage/generationSettingsStorage";

function makeImageBlob(text: string): Blob {
  return new Blob([text], { type: "image/png" });
}

describe("buildProjectBundle / parseProjectBundle", () => {
  it("round-trips prompts, settings, and referenced images", async () => {
    const bundle = await buildProjectBundle({
      projectName: "My Project",
      settings: DEFAULT_GENERATION_SETTINGS,
      images: [
        { id: "img-1", fileName: "fox.png", mimeType: "image/png", blob: makeImageBlob("fox") },
        { id: "img-2", fileName: "cat.png", mimeType: "image/png", blob: makeImageBlob("cat") },
      ],
      prompts: [
        { text: "A fox", referenceImageIds: ["img-1"], order: 0 },
        { text: "A cat and a fox", referenceImageIds: ["img-2", "img-1"], order: 1 },
        { text: "No references", order: 2 },
      ],
    });

    expect(bundle.formatVersion).toBe(PROJECT_BUNDLE_FORMAT_VERSION);
    expect(bundle.name).toBe("My Project");
    expect(bundle.images).toHaveLength(2);
    expect(bundle.prompts).toHaveLength(3);

    const parsed = parseProjectBundle(bundle);
    expect(parsed.name).toBe("My Project");
    expect(parsed.settings).toEqual(DEFAULT_GENERATION_SETTINGS);
    expect(parsed.images).toHaveLength(2);
    await expect(parsed.images[0]?.blob.text()).resolves.toBe("fox");
    await expect(parsed.images[1]?.blob.text()).resolves.toBe("cat");

    expect(parsed.prompts[0]).toMatchObject({ text: "A fox", referenceImageIndexes: [0] });
    expect(parsed.prompts[1]).toMatchObject({
      text: "A cat and a fox",
      referenceImageIndexes: [1, 0],
    });
    expect(parsed.prompts[2]).toMatchObject({ text: "No references", referenceImageIndexes: [] });
  });

  it("drops reference ids that don't match any bundled image", async () => {
    const bundle = await buildProjectBundle({
      projectName: "Orphan refs",
      prompts: [{ text: "Dangling", referenceImageIds: ["missing"], order: 0 }],
      images: [],
    });
    expect(bundle.prompts[0]?.referenceImageIndexes).toBeUndefined();
  });

  it("omits settings when none were provided", async () => {
    const bundle = await buildProjectBundle({
      projectName: "No settings",
      prompts: [],
      images: [],
    });
    expect(bundle.settings).toBeUndefined();
  });
});

describe("isProjectBundleFile", () => {
  it("accepts a well-formed bundle", async () => {
    const bundle = await buildProjectBundle({ projectName: "Valid", prompts: [], images: [] });
    expect(isProjectBundleFile(bundle)).toBe(true);
  });

  it("rejects null and non-objects", () => {
    expect(isProjectBundleFile(null)).toBe(false);
    expect(isProjectBundleFile("a string")).toBe(false);
    expect(isProjectBundleFile(42)).toBe(false);
  });

  it("rejects an object missing required fields", () => {
    expect(isProjectBundleFile({ formatVersion: 1, name: "x" })).toBe(false);
    expect(isProjectBundleFile({ name: "x", prompts: [], images: [] })).toBe(false);
  });

  it("rejects malformed prompt or image entries", () => {
    expect(
      isProjectBundleFile({
        formatVersion: 1,
        name: "x",
        prompts: [{ text: "ok" }],
        images: [],
      }),
    ).toBe(false);
    expect(
      isProjectBundleFile({
        formatVersion: 1,
        name: "x",
        prompts: [],
        images: [{ fileName: "a.png" }],
      }),
    ).toBe(false);
  });
});
