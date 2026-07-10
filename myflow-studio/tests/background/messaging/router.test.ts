import { describe, expect, it } from "vitest";
import { createMessageRouter } from "@background/messaging/router";
import type { ResponseEnvelope, EventEnvelope } from "@shared/messaging/protocol";
import type { HeartbeatEvent, PingResult } from "@shared/messaging/messages";
import { createFakePort } from "../../mocks/fakePort";

describe("createMessageRouter", () => {
  it("dispatches a request to its registered handler and posts the result", async () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.registerHandler("PING", () => {
      const result: PingResult = { ok: true, context: "background", uptimeMs: 42 };
      return Promise.resolve(result);
    });
    router.attachPort(port);

    port.emitMessage({ kind: "request", correlationId: "abc", message: { type: "PING" } });
    await Promise.resolve();
    await Promise.resolve();

    expect(port.sent).toEqual([
      {
        kind: "response",
        correlationId: "abc",
        result: { ok: true, context: "background", uptimeMs: 42 },
      },
    ]);
  });

  it("posts an error response when no handler is registered for the message type", async () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);

    port.emitMessage({ kind: "request", correlationId: "xyz", message: { type: "PING" } });
    await Promise.resolve();
    await Promise.resolve();

    expect(port.sent).toHaveLength(1);
    const [response] = port.sent as ResponseEnvelope[];
    expect(response?.correlationId).toBe("xyz");
    expect(response?.error).toMatch(/No handler registered/);
  });

  it("ignores non-request envelopes", () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);

    port.emitMessage({ kind: "response", correlationId: "abc", result: {} });
    port.emitMessage("garbage");
    port.emitMessage(null);

    expect(port.sent).toEqual([]);
  });

  it("broadcasts an event to every attached port", () => {
    const router = createMessageRouter();
    const portA = createFakePort();
    const portB = createFakePort();
    router.attachPort(portA);
    router.attachPort(portB);

    const event: HeartbeatEvent = { type: "HEARTBEAT", firedAt: 123 };
    router.broadcast(event);

    const expected: EventEnvelope<HeartbeatEvent> = { kind: "event", event };
    expect(portA.sent).toEqual([expected]);
    expect(portB.sent).toEqual([expected]);
  });

  it("stops broadcasting to a port after it disconnects", () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);

    port.emitDisconnect();
    router.broadcast({ type: "HEARTBEAT", firedAt: 1 });

    expect(port.sent).toEqual([]);
  });

  it("dispatch() rejects for an unregistered message type", async () => {
    const router = createMessageRouter();
    await expect(router.dispatch({ type: "PING_OFFSCREEN" })).rejects.toThrow(
      /No handler registered/,
    );
  });
});
