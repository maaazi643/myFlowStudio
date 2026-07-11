import type { CapturableElementRole } from "./roles";
import type { SelectorConfidence } from "./selectorBuilder";

/**
 * The background <-> content-script channel for Developer Mode capture,
 * separate from the port-based request/response bus in shared/messaging —
 * that bus is for the side panel; this one uses chrome.tabs.sendMessage /
 * chrome.runtime.sendMessage, the standard lightweight channel for talking
 * to a specific tab's content script. Message types are prefixed to avoid
 * colliding with any other extension's onMessage listener on the same page.
 */

export interface StartPickingCommand {
  type: "MYFLOW_START_PICKING";
  role: CapturableElementRole;
}

export interface StopPickingCommand {
  type: "MYFLOW_STOP_PICKING";
}

export type ContentCommand = StartPickingCommand | StopPickingCommand;

export function isContentCommand(value: unknown): value is ContentCommand {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const type = (value as { type?: unknown }).type;
  return type === "MYFLOW_START_PICKING" || type === "MYFLOW_STOP_PICKING";
}

export interface CaptureResultEvent {
  type: "MYFLOW_CAPTURE_RESULT";
  role: CapturableElementRole;
  selector: string;
  confidence: SelectorConfidence;
  reason: string;
  tagName: string;
  warning?: string | undefined;
  pageUrl: string;
}

export interface CaptureCancelledEvent {
  type: "MYFLOW_CAPTURE_CANCELLED";
  role: CapturableElementRole;
}

export type ContentEvent = CaptureResultEvent | CaptureCancelledEvent;

export function isContentEvent(value: unknown): value is ContentEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const type = (value as { type?: unknown }).type;
  return type === "MYFLOW_CAPTURE_RESULT" || type === "MYFLOW_CAPTURE_CANCELLED";
}
