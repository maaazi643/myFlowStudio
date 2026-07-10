/**
 * Placeholder set pending the automation feasibility spike confirming
 * which models Google Flow actually exposes and their real identifiers.
 * The settings UI and validation only ever read this list — never a
 * hardcoded model name — so swapping in the real ones is a one-file change.
 */
export interface ModelOption {
  id: string;
  label: string;
}

export const MODELS: readonly ModelOption[] = [
  { id: "flow-standard", label: "Flow — Standard" },
  { id: "flow-fast", label: "Flow — Fast" },
];

export const DEFAULT_MODEL_ID = "flow-standard";

export function getModel(id: string): ModelOption | undefined {
  return MODELS.find((model) => model.id === id);
}
