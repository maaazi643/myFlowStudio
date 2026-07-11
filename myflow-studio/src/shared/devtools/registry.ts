import type { CapturableElementRole } from "./roles";
import type { SelectorConfidence } from "./selectorBuilder";

export interface CapturedSelector {
  role: CapturableElementRole;
  selector: string;
  confidence: SelectorConfidence;
  reason: string;
  tagName: string;
  /** Set when the captured element didn't quite match the role's expected kind — surfaced, not blocking. */
  warning?: string | undefined;
  pageUrl: string;
  capturedAt: number;
}

export type SelectorRegistry = Partial<Record<CapturableElementRole, CapturedSelector>>;

const ALL_ROLES: readonly CapturableElementRole[] = [
  "promptBox",
  "generateButton",
  "downloadButton",
  "referenceUpload",
  "modelSelector",
  "aspectRatioSelector",
  "qualitySelector",
];

/** The subset of roles the real automation engine (M6) treats as required to run at all — selectors, not options, are optional. */
const REQUIRED_ROLES: readonly CapturableElementRole[] = [
  "promptBox",
  "generateButton",
  "downloadButton",
];

export function isRegistryComplete(registry: SelectorRegistry): boolean {
  return REQUIRED_ROLES.every((role) => registry[role] !== undefined);
}

export function missingRequiredRoles(registry: SelectorRegistry): CapturableElementRole[] {
  return REQUIRED_ROLES.filter((role) => registry[role] === undefined);
}

export function capturedRoleCount(registry: SelectorRegistry): number {
  return ALL_ROLES.filter((role) => registry[role] !== undefined).length;
}
