import type { QueueRun } from "@shared/types/queue";
import type { LogEntry } from "@shared/types/logEntry";

/**
 * Every request/response and broadcast type the extension knows about.
 * Started small — PING proves the background service worker is alive and
 * reachable over a port, PING_OFFSCREEN proves the background can lazily
 * create and talk to the offscreen document. M7 adds the queue control
 * messages; later milestones extend these unions rather than replacing them.
 *
 * Content-script <-> background traffic (automation commands, discovery
 * status, logs) uses a separate one-shot chrome.runtime.sendMessage
 * channel — see shared/automation/contentAutomationProtocol.ts — not this
 * port-based bus.
 */

export interface PingRequest {
  type: "PING";
}

export interface PingOffscreenRequest {
  type: "PING_OFFSCREEN";
}

export interface StartQueueRequest {
  type: "QUEUE_START";
}

export interface PauseQueueRequest {
  type: "QUEUE_PAUSE";
}

export interface ResumeQueueRequest {
  type: "QUEUE_RESUME";
}

export interface StopQueueRequest {
  type: "QUEUE_STOP";
}

export interface SkipCurrentQueueItemRequest {
  type: "QUEUE_SKIP_CURRENT";
}

export interface RetryQueueItemRequest {
  type: "QUEUE_RETRY_ITEM";
  itemId: string;
}

export interface RetryAllFailedQueueItemsRequest {
  type: "QUEUE_RETRY_ALL_FAILED";
}

export interface RetrySelectedQueueItemsRequest {
  type: "QUEUE_RETRY_SELECTED";
  itemIds: string[];
}

export interface GetQueueStateRequest {
  type: "QUEUE_GET_STATE";
}

export type RequestMessage =
  | PingRequest
  | PingOffscreenRequest
  | StartQueueRequest
  | PauseQueueRequest
  | ResumeQueueRequest
  | StopQueueRequest
  | SkipCurrentQueueItemRequest
  | RetryQueueItemRequest
  | RetryAllFailedQueueItemsRequest
  | RetrySelectedQueueItemsRequest
  | GetQueueStateRequest;

export interface PingResult {
  ok: true;
  context: "background" | "offscreen";
  uptimeMs: number;
}

export interface HeartbeatEvent {
  type: "HEARTBEAT";
  firedAt: number;
}

export interface QueueProgressEvent {
  type: "QUEUE_PROGRESS";
  run: QueueRun;
}

export interface LogAppendedEvent {
  type: "LOG_APPENDED";
  entry: LogEntry;
}

export type BroadcastEvent = HeartbeatEvent | QueueProgressEvent | LogAppendedEvent;
