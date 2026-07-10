/**
 * Every request/response and broadcast type the extension knows about.
 * Deliberately small right now — PING proves the background service
 * worker is alive and reachable over a port, PING_OFFSCREEN proves the
 * background can lazily create and talk to the offscreen document.
 * Later milestones (M6-M8) extend these unions rather than replacing them.
 */

export interface PingRequest {
  type: "PING";
}

export interface PingOffscreenRequest {
  type: "PING_OFFSCREEN";
}

export type RequestMessage = PingRequest | PingOffscreenRequest;

export interface PingResult {
  ok: true;
  context: "background" | "offscreen";
  uptimeMs: number;
}

export interface HeartbeatEvent {
  type: "HEARTBEAT";
  firedAt: number;
}

export type BroadcastEvent = HeartbeatEvent;
