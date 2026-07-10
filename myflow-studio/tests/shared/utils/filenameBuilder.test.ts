import { describe, expect, it } from "vitest";
import { buildFilename } from "@shared/utils/filenameBuilder";

describe("buildFilename", () => {
  it("pads a numbered filename to the requested width", () => {
    expect(buildFilename({ index: 0, startNumber: 1, padding: 4, template: "numbered" })).toBe(
      "0001.png",
    );
    expect(buildFilename({ index: 1, startNumber: 1, padding: 4, template: "numbered" })).toBe(
      "0002.png",
    );
  });

  it("offsets from a non-1 start number", () => {
    expect(buildFilename({ index: 0, startNumber: 245, padding: 4, template: "numbered" })).toBe(
      "0245.png",
    );
    expect(buildFilename({ index: 2, startNumber: 245, padding: 4, template: "numbered" })).toBe(
      "0247.png",
    );
  });

  it("appends a slugified prompt for the numbered-prompt template", () => {
    expect(
      buildFilename({
        index: 0,
        startNumber: 245,
        padding: 4,
        template: "numbered-prompt",
        promptText: "My Prompt",
      }),
    ).toBe("0245_My_Prompt.png");
  });

  it("defaults to a png extension", () => {
    expect(buildFilename({ index: 0, startNumber: 1, padding: 4, template: "numbered" })).toMatch(
      /\.png$/,
    );
  });

  it("respects a custom extension", () => {
    expect(
      buildFilename({
        index: 0,
        startNumber: 1,
        padding: 4,
        template: "numbered",
        extension: "webp",
      }),
    ).toBe("0001.webp");
  });

  it("does not pad beyond the requested width when the number is already wider", () => {
    expect(buildFilename({ index: 0, startNumber: 12345, padding: 4, template: "numbered" })).toBe(
      "12345.png",
    );
  });
});
