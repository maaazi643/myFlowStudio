import type { GenerationSettings } from "@shared/types/generationSettings";
import { SPEED_PROFILES } from "@shared/config/speedProfiles";
import { isImagesPerPrompt } from "@shared/config/imagesPerPrompt";
import { ASPECT_RATIOS } from "@shared/config/aspectRatios";
import { MODELS } from "@shared/config/models";
import { QUALITY_OPTIONS } from "@shared/config/quality";

export type GenerationSettingsErrors = Partial<Record<keyof GenerationSettings, string>>;

export interface ValidationResult {
  valid: boolean;
  errors: GenerationSettingsErrors;
}

const MIN_START_NUMBER = 0;
const MIN_PADDING = 1;
const MAX_PADDING = 8;

/**
 * Every option here is checked against its current config registry, not a
 * hardcoded list — an option that's since been removed from
 * shared/config fails validation instead of silently generating with a
 * dead value. The queue engine (M7) calls this before allowing Start.
 */
export function validateGenerationSettings(settings: GenerationSettings): ValidationResult {
  const errors: GenerationSettingsErrors = {};

  if (!SPEED_PROFILES.some((profile) => profile.id === settings.speedProfileId)) {
    errors.speedProfileId = "Choose a valid generation speed.";
  }
  if (!isImagesPerPrompt(settings.imagesPerPrompt)) {
    errors.imagesPerPrompt = "Choose how many images to generate per prompt.";
  }
  if (!ASPECT_RATIOS.some((ratio) => ratio.id === settings.aspectRatioId)) {
    errors.aspectRatioId = "Choose a valid aspect ratio.";
  }
  if (!MODELS.some((model) => model.id === settings.modelId)) {
    errors.modelId = "Choose a valid model.";
  }
  if (!QUALITY_OPTIONS.some((quality) => quality.id === settings.qualityId)) {
    errors.qualityId = "Choose a valid image quality.";
  }
  if (!Number.isInteger(settings.startNumber) || settings.startNumber < MIN_START_NUMBER) {
    errors.startNumber = "Start number must be a whole number of 0 or more.";
  }
  if (
    !Number.isInteger(settings.numberPadding) ||
    settings.numberPadding < MIN_PADDING ||
    settings.numberPadding > MAX_PADDING
  ) {
    errors.numberPadding = `Padding must be a whole number between ${String(MIN_PADDING)} and ${String(MAX_PADDING)}.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
