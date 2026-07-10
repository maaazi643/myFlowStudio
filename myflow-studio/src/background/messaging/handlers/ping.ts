import type { PingResult } from "@shared/messaging/messages";
import type { MessageRouter } from "../router";
import { ensureOffscreenDocument } from "../../offscreen/ensureOffscreenDocument";

const startedAt = performance.now();

export function registerPingHandler(router: MessageRouter): void {
  router.registerHandler("PING", () => {
    const result: PingResult = {
      ok: true,
      context: "background",
      uptimeMs: performance.now() - startedAt,
    };
    return Promise.resolve(result);
  });

  router.registerHandler("PING_OFFSCREEN", async () => {
    await ensureOffscreenDocument();
    return chrome.runtime.sendMessage({ type: "PING_OFFSCREEN" });
  });
}
