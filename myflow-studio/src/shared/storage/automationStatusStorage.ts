import { defineStorageKey } from "./chromeStorage";
import type { AutomationStatus } from "@shared/automation/discoveryStatus";

/** null until the content script's discovery engine has reported at least once. */
export const automationStatusStorageKey = defineStorageKey<AutomationStatus | null>(
  "automationStatus",
  null,
);
