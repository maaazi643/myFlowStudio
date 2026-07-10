import { describe, expect, it } from "vitest";
import { validateGenerationSettings } from "@shared/utils/validators/generationSettingsValidator";
import type { GenerationSettings } from "@shared/types/generationSettings";

function validSettings(overrides: Partial<GenerationSettings> = {}): GenerationSettings {
  return {
    speedProfileId: "balanced",
    imagesPerPrompt: 1,
    aspectRatioId: "16:9",
    modelId: "flow-standard",
    qualityId: "standard",
    autoDownload: true,
    startNumber: 1,
    numberPadding: 4,
    filenameTemplate: "numbered",
    ...overrides,
  };
}

describe("validateGenerationSettings", () => {
  it("accepts a fully valid settings object", () => {
    const result = validateGenerationSettings(validSettings());
    expect(result).toEqual({ valid: true, errors: {} });
  });

  it("flags an unknown speed profile id", () => {
    const result = validateGenerationSettings(validSettings({ speedProfileId: "ludicrous" }));
    expect(result.valid).toBe(false);
    expect(result.errors.speedProfileId).toBeDefined();
  });

  it("flags an images-per-prompt value outside the configured options", () => {
    const result = validateGenerationSettings(validSettings({ imagesPerPrompt: 7 }));
    expect(result.valid).toBe(false);
    expect(result.errors.imagesPerPrompt).toBeDefined();
  });

  it("flags an unknown aspect ratio id", () => {
    const result = validateGenerationSettings(validSettings({ aspectRatioId: "21:9" }));
    expect(result.errors.aspectRatioId).toBeDefined();
  });

  it("flags an unknown model id", () => {
    const result = validateGenerationSettings(validSettings({ modelId: "not-a-model" }));
    expect(result.errors.modelId).toBeDefined();
  });

  it("flags an unknown quality id", () => {
    const result = validateGenerationSettings(validSettings({ qualityId: "extreme" }));
    expect(result.errors.qualityId).toBeDefined();
  });

  it("flags a negative start number", () => {
    const result = validateGenerationSettings(validSettings({ startNumber: -1 }));
    expect(result.errors.startNumber).toBeDefined();
  });

  it("flags a non-integer start number", () => {
    const result = validateGenerationSettings(validSettings({ startNumber: 1.5 }));
    expect(result.errors.startNumber).toBeDefined();
  });

  it("flags padding below the allowed range", () => {
    const result = validateGenerationSettings(validSettings({ numberPadding: 0 }));
    expect(result.errors.numberPadding).toBeDefined();
  });

  it("flags padding above the allowed range", () => {
    const result = validateGenerationSettings(validSettings({ numberPadding: 9 }));
    expect(result.errors.numberPadding).toBeDefined();
  });

  it("accepts padding at the edges of the allowed range", () => {
    expect(validateGenerationSettings(validSettings({ numberPadding: 1 })).valid).toBe(true);
    expect(validateGenerationSettings(validSettings({ numberPadding: 8 })).valid).toBe(true);
  });

  it("reports every invalid field at once, not just the first", () => {
    const result = validateGenerationSettings(
      validSettings({ speedProfileId: "x", modelId: "y", startNumber: -5 }),
    );
    expect(Object.keys(result.errors).sort()).toEqual(
      ["modelId", "speedProfileId", "startNumber"].sort(),
    );
  });
});
