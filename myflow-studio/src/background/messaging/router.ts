import type { BroadcastEvent, RequestMessage } from "@shared/messaging/messages";
import type { PortLike } from "@shared/messaging/port";
import {
  isRequestEnvelope,
  type EventEnvelope,
  type ResponseEnvelope,
} from "@shared/messaging/protocol";

type Handler<TType extends RequestMessage["type"]> = (
  message: Extract<RequestMessage, { type: TType }>,
) => Promise<unknown>;

export interface MessageRouter {
  registerHandler<TType extends RequestMessage["type"]>(type: TType, handler: Handler<TType>): void;
  dispatch(message: RequestMessage): Promise<unknown>;
  broadcast(event: BroadcastEvent): void;
  /** Wires a port's incoming requests to registered handlers and tracks it for broadcast. */
  attachPort(port: PortLike): void;
}

export function createMessageRouter(): MessageRouter {
  const handlers = new Map<RequestMessage["type"], Handler<RequestMessage["type"]>>();
  const ports = new Set<PortLike>();

  function dispatch(message: RequestMessage): Promise<unknown> {
    const handler = handlers.get(message.type);
    if (!handler) {
      return Promise.reject(new Error(`No handler registered for message type "${message.type}".`));
    }
    return handler(message);
  }

  return {
    registerHandler(type, handler) {
      handlers.set(type, handler as unknown as Handler<RequestMessage["type"]>);
    },

    dispatch,

    broadcast(event) {
      const envelope: EventEnvelope<BroadcastEvent> = { kind: "event", event };
      ports.forEach((port) => {
        port.postMessage(envelope);
      });
    },

    attachPort(port) {
      ports.add(port);

      port.onMessage.addListener((raw) => {
        if (!isRequestEnvelope(raw)) {
          return;
        }
        const { correlationId, message } = raw;
        dispatch(message as RequestMessage)
          .then((result) => {
            const response: ResponseEnvelope = { kind: "response", correlationId, result };
            port.postMessage(response);
          })
          .catch((error: unknown) => {
            const response: ResponseEnvelope = {
              kind: "response",
              correlationId,
              error: error instanceof Error ? error.message : "Unknown error.",
            };
            port.postMessage(response);
          });
      });

      port.onDisconnect.addListener(() => {
        ports.delete(port);
      });
    },
  };
}
