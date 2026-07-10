import { describe, expect, it } from "vitest";
import { createMessagingClient } from "@shared/messaging/client";
import { createMessageRouter } from "@background/messaging/router";
import type { PingResult } from "@shared/messaging/messages";
import { createFakePortPair } from "../../mocks/fakePort";

describe("client + router over a real port pair", () => {
  it("round-trips a request end to end", async () => {
    const [clientSidePort, serverSidePort] = createFakePortPair();
    const router = createMessageRouter();
    router.registerHandler("PING", () => {
      const result: PingResult = { ok: true, context: "background", uptimeMs: 7 };
      return Promise.resolve(result);
    });
    router.attachPort(serverSidePort);
    const client = createMessagingClient(clientSidePort);

    const result = await client.request<PingResult>({ type: "PING" });

    expect(result).toEqual({ ok: true, context: "background", uptimeMs: 7 });
  });

  it("propagates a handler rejection back to the client as an error", async () => {
    const [clientSidePort, serverSidePort] = createFakePortPair();
    const router = createMessageRouter();
    router.registerHandler("PING", () => Promise.reject(new Error("offscreen unavailable")));
    router.attachPort(serverSidePort);
    const client = createMessagingClient(clientSidePort);

    await expect(client.request({ type: "PING" })).rejects.toThrow("offscreen unavailable");
  });

  it("delivers a broadcast event to a connected client", async () => {
    const [clientSidePort, serverSidePort] = createFakePortPair();
    const router = createMessageRouter();
    router.attachPort(serverSidePort);
    const client = createMessagingClient(clientSidePort);

    const received = new Promise((resolve) => {
      client.onEvent(resolve);
    });
    router.broadcast({ type: "HEARTBEAT", firedAt: 99 });

    await expect(received).resolves.toEqual({ type: "HEARTBEAT", firedAt: 99 });
  });

  it("supports multiple concurrent requests on the same port, resolved independently", async () => {
    const [clientSidePort, serverSidePort] = createFakePortPair();
    const router = createMessageRouter();
    router.registerHandler("PING", () => {
      const result: PingResult = { ok: true, context: "background", uptimeMs: 1 };
      return Promise.resolve(result);
    });
    router.registerHandler("PING_OFFSCREEN", () => {
      const result: PingResult = { ok: true, context: "offscreen", uptimeMs: 2 };
      return Promise.resolve(result);
    });
    router.attachPort(serverSidePort);
    const client = createMessagingClient(clientSidePort);

    const [ping, pingOffscreen] = await Promise.all([
      client.request<PingResult>({ type: "PING" }),
      client.request<PingResult>({ type: "PING_OFFSCREEN" }),
    ]);

    expect(ping.context).toBe("background");
    expect(pingOffscreen.context).toBe("offscreen");
  });
});
