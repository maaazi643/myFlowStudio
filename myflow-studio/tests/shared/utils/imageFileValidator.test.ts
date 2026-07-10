import { describe, expect, it } from "vitest";
import { validateImageFile } from "@shared/utils/validators/imageFileValidator";

describe("validateImageFile", () => {
  it("accepts a reasonably sized image file", () => {
    expect(validateImageFile({ type: "image/png", size: 1024 })).toEqual({ valid: true });
  });

  it("rejects a non-image mime type", () => {
    const result = validateImageFile({ type: "application/pdf", size: 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/isn't an image/);
  });

  it("rejects an empty file", () => {
    const result = validateImageFile({ type: "image/png", size: 0 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/empty/);
  });

  it("rejects a file over the size limit", () => {
    const result = validateImageFile({ type: "image/png", size: 9 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/8 MB/);
  });

  it("accepts a file exactly at the size limit", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 8 * 1024 * 1024 }).valid).toBe(true);
  });

  it("accepts any image/* subtype", () => {
    expect(validateImageFile({ type: "image/webp", size: 100 }).valid).toBe(true);
    expect(validateImageFile({ type: "image/svg+xml", size: 100 }).valid).toBe(true);
  });
});
