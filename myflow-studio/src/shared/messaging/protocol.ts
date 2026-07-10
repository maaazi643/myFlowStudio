/**
 * Envelope shapes sent over a chrome.runtime.Port. A request/response pair
 * is correlated by id so many requests can be in flight on one long-lived
 * port at once — plain one-shot chrome.runtime.sendMessage calls don't need
 * this, but the content-script/background channel this bus is built for
 * will be busy enough (M6/M7) that a single multiplexed port beats opening
 * a new message channel per call.
 */

export interface RequestEnvelope<TMessage = unknown> {
  kind: "request";
  correlationId: string;
  message: TMessage;
}

export interface ResponseEnvelope<TResult = unknown> {
  kind: "response";
  correlationId: string;
  result?: TResult;
  error?: string;
}

export interface EventEnvelope<TEvent = unknown> {
  kind: "event";
  event: TEvent;
}

export type Envelope<TMessage = unknown, TResult = unknown, TEvent = unknown> =
  RequestEnvelope<TMessage> | ResponseEnvelope<TResult> | EventEnvelope<TEvent>;

export function isRequestEnvelope(value: unknown): value is RequestEnvelope {
  return isEnvelopeOfKind(value, "request");
}

export function isResponseEnvelope(value: unknown): value is ResponseEnvelope {
  return isEnvelopeOfKind(value, "response");
}

export function isEventEnvelope(value: unknown): value is EventEnvelope {
  return isEnvelopeOfKind(value, "event");
}

function isEnvelopeOfKind(value: unknown, kind: Envelope["kind"]): boolean {
  return typeof value === "object" && value !== null && (value as { kind?: unknown }).kind === kind;
}
