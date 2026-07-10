import type { BroadcastEvent, RequestMessage } from "./messages";
import type { PortLike } from "./port";
import {
  isEventEnvelope,
  isResponseEnvelope,
  type EventEnvelope,
  type RequestEnvelope,
} from "./protocol";

export interface MessagingClient {
  request<TResult>(message: RequestMessage): Promise<TResult>;
  /** Returns an unsubscribe function. */
  onEvent(listener: (event: BroadcastEvent) => void): () => void;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

export function createMessagingClient(
  port: PortLike,
  generateId: () => string = () => crypto.randomUUID(),
): MessagingClient {
  const pending = new Map<string, PendingRequest>();
  const eventListeners = new Set<(event: BroadcastEvent) => void>();

  port.onMessage.addListener((raw) => {
    if (isResponseEnvelope(raw)) {
      const waiter = pending.get(raw.correlationId);
      if (!waiter) {
        return;
      }
      pending.delete(raw.correlationId);
      if (raw.error) {
        waiter.reject(new Error(raw.error));
      } else {
        waiter.resolve(raw.result);
      }
      return;
    }
    if (isEventEnvelope(raw)) {
      const envelope = raw as EventEnvelope<BroadcastEvent>;
      eventListeners.forEach((listener) => {
        listener(envelope.event);
      });
    }
  });

  port.onDisconnect.addListener(() => {
    pending.forEach((waiter) => {
      waiter.reject(new Error("Message port disconnected before a response arrived."));
    });
    pending.clear();
  });

  return {
    request<TResult>(message: RequestMessage) {
      const correlationId = generateId();
      const envelope: RequestEnvelope<RequestMessage> = { kind: "request", correlationId, message };
      return new Promise<TResult>((resolve, reject) => {
        pending.set(correlationId, { resolve: resolve as (value: unknown) => void, reject });
        port.postMessage(envelope);
      });
    },
    onEvent(listener) {
      eventListeners.add(listener);
      return () => {
        eventListeners.delete(listener);
      };
    },
  };
}
