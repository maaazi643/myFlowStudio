/**
 * Placeholder set pending the automation feasibility spike (roadmap
 * milestone SPIKE) confirming Google Flow's actual supported ratios and
 * the values its UI expects. Adding a real one later is just adding an
 * entry here — nothing in the settings UI or validation hardcodes this list.
 */
export interface AspectRatioOption {
  id: string;
  label: string;
}

export const ASPECT_RATIOS: readonly AspectRatioOption[] = [
  { id: "16:9", label: "Widescreen (16:9)" },
  { id: "9:16", label: "Portrait (9:16)" },
  { id: "1:1", label: "Square (1:1)" },
  { id: "4:3", label: "Classic (4:3)" },
];

export const DEFAULT_ASPECT_RATIO_ID = "16:9";

export function getAspectRatio(id: string): AspectRatioOption | undefined {
  return ASPECT_RATIOS.find((ratio) => ratio.id === id);
}
