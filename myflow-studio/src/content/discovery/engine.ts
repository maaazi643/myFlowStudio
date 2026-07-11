import { AUTOMATION_ROLE_DEFINITIONS } from "@shared/automation/roles";
import type { AutomationRole } from "@shared/automation/roles";
import type { AutomationStatus, RoleStatus } from "@shared/automation/discoveryStatus";
import { discoverRole } from "./scan";
import { log } from "../logging";

const DEBOUNCE_MS = 400;

export interface DiscoveryEngine {
  start(): void;
  stop(): void;
  /** Re-runs discovery immediately (no debounce) — used as defense-in-depth right before an automation action. */
  rescan(): void;
  getElement(role: AutomationRole): Element | null;
  getStatus(): AutomationStatus;
}

/**
 * Owns the content script's live view of the Google Flow page: scans once
 * on creation, then re-scans (debounced) whenever the DOM mutates, so
 * discovered elements never go stale as Flow's own UI re-renders. Reports
 * every status change (not just failures) so the side panel always
 * reflects what's currently on the page.
 */
export function createDiscoveryEngine(onStatusChange: (status: AutomationStatus) => void): DiscoveryEngine {
  let elements: Partial<Record<AutomationRole, Element>> = {};
  let status: AutomationStatus = { pageUrl: window.location.href, updatedAt: Date.now(), roles: {} };
  let previouslyFound: Partial<Record<AutomationRole, boolean>> = {};
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let observer: MutationObserver | undefined;

  function scanNow(): void {
    const roles: Partial<Record<AutomationRole, RoleStatus>> = {};
    const nextElements: Partial<Record<AutomationRole, Element>> = {};

    for (const definition of AUTOMATION_ROLE_DEFINITIONS) {
      const match = discoverRole(definition.role);
      if (match) {
        nextElements[definition.role] = match.element;
        roles[definition.role] = { found: true, tier: match.tier, strategyName: match.strategyName };
      } else {
        roles[definition.role] = { found: false };
      }

      const wasFound = previouslyFound[definition.role];
      const isFound = match !== null;
      if (wasFound !== isFound) {
        if (isFound) {
          log.info(
            `${definition.label} discovered (tier ${String(match.tier)}, ${match.strategyName}).`,
          );
        } else if (definition.required) {
          log.warning(`${definition.label} is no longer found on the page.`);
        }
      }
    }

    previouslyFound = Object.fromEntries(
      AUTOMATION_ROLE_DEFINITIONS.map((definition) => [definition.role, roles[definition.role]?.found ?? false]),
    );

    elements = nextElements;
    status = { pageUrl: window.location.href, updatedAt: Date.now(), roles };
    onStatusChange(status);
  }

  function scheduleRescan(): void {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      scanNow();
    }, DEBOUNCE_MS);
  }

  return {
    start() {
      scanNow();
      observer = new MutationObserver(() => {
        scheduleRescan();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    },
    stop() {
      observer?.disconnect();
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
      }
    },
    rescan() {
      scanNow();
    },
    getElement(role) {
      return elements[role] ?? null;
    },
    getStatus() {
      return status;
    },
  };
}
