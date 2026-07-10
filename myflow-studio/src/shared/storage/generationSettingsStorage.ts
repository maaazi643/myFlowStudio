import { defineStorageKey } from "./chromeStorage";
import type { GenerationSettings } from "@shared/types/generationSettings";
import { DEFAULT_SPEED_PROFILE_ID } from "@shared/config/speedProfiles";
import { DEFAULT_IMAGES_PER_PROMPT } from "@shared/config/imagesPerPrompt";
import { DEFAULT_ASPECT_RATIO_ID } from "@shared/config/aspectRatios";
import { DEFAULT_MODEL_ID } from "@shared/config/models";
import { DEFAULT_QUALITY_ID } from "@shared/config/quality";

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  speedProfileId: DEFAULT_SPEED_PROFILE_ID,
  imagesPerPrompt: DEFAULT_IMAGES_PER_PROMPT,
  aspectRatioId: DEFAULT_ASPECT_RATIO_ID,
  modelId: DEFAULT_MODEL_ID,
  qualityId: DEFAULT_QUALITY_ID,
  autoDownload: true,
  startNumber: 1,
  numberPadding: 4,
  filenameTemplate: "numbered",
};

export const generationSettingsStorageKey = defineStorageKey<GenerationSettings>(
  "generationSettings",
  DEFAULT_GENERATION_SETTINGS,
);
