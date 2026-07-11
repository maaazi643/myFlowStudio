/**
 * Background <-> content-script channel for driving one generation on the
 * real Google Flow page. The content script discovers every element it
 * needs itself (see content/discovery) — no selector ever crosses this
 * boundary. Deliberately does not touch the model/aspect-ratio/quality
 * selectors: knowing *which element* opens a dropdown doesn't tell us which
 * option inside it corresponds to the user's chosen value, and guessing
 * that mapping is exactly the kind of guess this project avoids. Those
 * three roles are still discovered and reported in AutomationStatus for a
 * future milestone; this automation runner only fills the prompt,
 * optionally attaches reference images, clicks Generate, and optionally
 * clicks Download.
 */

import type { AutomationStatus } from "./discoveryStatus";

export interface AutomationReferenceImage {
  fileName: string;
  mimeType: string;
  dataBase64: string;
}

export interface RunAutomationCommand {
  type: "MYFLOW_RUN_AUTOMATION";
  requestId: string;
  promptText: string;
  referenceImages: AutomationReferenceImage[];
  /** Whether to click the download button once generation finishes (mirrors GenerationSettings.autoDownload). */
  clickDownload: boolean;
  /** How long to wait for generation to finish before giving up. */
  maxWaitMs: number;
}

export function isRunAutomationCommand(value: unknown): value is RunAutomationCommand {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "MYFLOW_RUN_AUTOMATION"
  );
}

export interface AutomationCompleteEvent {
  type: "MYFLOW_AUTOMATION_COMPLETE";
  requestId: string;
  ok: boolean;
  error?: string | undefined;
}

export function isAutomationCompleteEvent(value: unknown): value is AutomationCompleteEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "MYFLOW_AUTOMATION_COMPLETE"
  );
}

/** Sent by the content script whenever its discovery engine's findings change (initial scan, or after a debounced re-scan following a DOM mutation). */
export interface DiscoveryStatusMessage {
  type: "MYFLOW_DISCOVERY_STATUS";
  status: AutomationStatus;
}

export function isDiscoveryStatusMessage(value: unknown): value is DiscoveryStatusMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "MYFLOW_DISCOVERY_STATUS"
  );
}
