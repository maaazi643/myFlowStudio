import { describe, expect, it, vi } from "vitest";
import { createMessagingClient } from "@shared/messaging/client";
import type { RequestEnvelope } from "@shared/messaging/protocol";
import type { RequestMessage } from "@shared/messaging/messages";
import { createFakePort } from "../../mocks/fakePort";

describe("createMessagingClient", () => {
  it("sends a request envelope with a generated correlation id", () => {
    const port = createFakePort();
    const client = createMessagingClient(port, () => "fixed-id");

    void client.request({ type: "PING" });

    expect(port.sent).toEqual([
      { kind: "request", correlationId: "fixed-id", message: { type: "PING" } },
    ]);
  });

  it("resolves the matching pending request when a response arrives", async () => {
    const port = createFakePort();
    const client = createMessagingClient(port, () => "req-1");

    const promise = client.request({ type: "PING" });
    port.emitMessage({ kind: "response", correlationId: "req-1", result: { ok: true } });

    await expect(promise).resolves.toEqual({ ok: true });
  });

  it("rejects when the response carries an error", async () => {
    const port = createFakePort();
    const client = createMessagingClient(port, () => "req-1");

    const promise = client.request({ type: "PING" });
    port.emitMessage({ kind: "response", correlationId: "req-1", error: "boom" });

    await expect(promise).rejects.toThrow("boom");
  });

  it("ignores a response whose correlation id doesn't match any pending request", async () => {
    const port = createFakePort();
    const client = createMessagingClient(port, () => "req-1");

    const promise = client.request({ type: "PING" });
    port.emitMessage({ kind: "response", correlationId: "someone-else", result: {} });
    port.emitMessage({ kind: "response", correlationId: "req-1", result: { ok: true } });

    await expect(promise).resolves.toEqual({ ok: true });
  });

  it("delivers broadcast events to subscribed listeners until unsubscribed", () => {
    const port = createFakePort();
    const client = createMessagingClient(port);
    const listener = vi.fn();

    const unsubscribe = client.onEvent(listener);
    port.emitMessage({ kind: "event", event: { type: "HEARTBEAT", firedAt: 1 } });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ type: "HEARTBEAT", firedAt: 1 });

    unsubscribe();
    port.emitMessage({ kind: "event", event: { type: "HEARTBEAT", firedAt: 2 } });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("rejects all pending requests when the port disconnects", async () => {
    const port = createFakePort();
    const client = createMessagingClient(port, () => "req-1");

    const promise = client.request({ type: "PING" });
    port.emitDisconnect();

    await expect(promise).rejects.toThrow(/disconnected/);
  });

  it("disconnect() closes the underlying port and rejects any pending request", async () => {
    const port = createFakePort();
    const client = createMessagingClient(port, () => "req-1");

    const promise = client.request({ type: "PING" });
    client.disconnect();

    await expect(promise).rejects.toThrow(/disconnected/);
  });

  it("uses a distinct correlation id per request by default", () => {
    const port = createFakePort();
    const client = createMessagingClient(port);

    void client.request({ type: "PING" });
    void client.request({ type: "PING_OFFSCREEN" } satisfies RequestMessage);

    const ids = (port.sent as RequestEnvelope[]).map((envelope) => envelope.correlationId);
    expect(new Set(ids).size).toBe(2);
  });
});
