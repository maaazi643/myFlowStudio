export { createMessagingClient } from "./client";
export type { MessagingClient } from "./client";
export { connectToBackground } from "./connect";
export type { PortLike } from "./port";
export type {
  RequestMessage,
  PingRequest,
  PingOffscreenRequest,
  PingResult,
  BroadcastEvent,
  HeartbeatEvent,
} from "./messages";
export type { Envelope, RequestEnvelope, ResponseEnvelope, EventEnvelope } from "./protocol";
