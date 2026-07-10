export interface QualityOption {
  id: string;
  label: string;
}

export const QUALITY_OPTIONS: readonly QualityOption[] = [
  { id: "standard", label: "Standard" },
  { id: "high", label: "High" },
  { id: "ultra", label: "Ultra" },
];

export const DEFAULT_QUALITY_ID = "standard";

export function getQuality(id: string): QualityOption | undefined {
  return QUALITY_OPTIONS.find((quality) => quality.id === id);
}
