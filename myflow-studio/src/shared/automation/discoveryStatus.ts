import type { AutomationRole } from "./roles";

export interface RoleStatus {
  found: boolean;
  /** Which discovery tier (1-7) matched, when found. */
  tier?: number;
  /** Human-readable name of the strategy that matched, when found. */
  strategyName?: string;
}

/**
 * Live snapshot of what the content script's discovery engine currently
 * sees on the page. Written by the content script (via a one-shot message
 * to the background) and read directly by the side panel through
 * chrome.storage — no user action ever produces or edits this.
 */
export interface AutomationStatus {
  pageUrl: string | null;
  updatedAt: number;
  roles: Partial<Record<AutomationRole, RoleStatus>>;
}
