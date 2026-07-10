import { generationSettingsStorageKey } from "@shared/storage/generationSettingsStorage";
import type { GenerationSettings } from "@shared/types/generationSettings";
import { useStorageValue } from "./useStorageValue";

export function useGenerationSettings(): [GenerationSettings, (value: GenerationSettings) => void] {
  return useStorageValue(generationSettingsStorageKey);
}
