import type { PingOffscreenRequest, PingResult } from "@shared/messaging/messages";

// Bootstrap only. The blob-to-file conversion pipeline arrives with M8
// (downloads) — for now this just proves the offscreen document can be
// created and reached from the background service worker.

const startedAt = performance.now();

function isPingOffscreenRequest(message: unknown): message is PingOffscreenRequest {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === "PING_OFFSCREEN"
  );
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isPingOffscreenRequest(message)) {
    return false;
  }
  const result: PingResult = {
    ok: true,
    context: "offscreen",
    uptimeMs: performance.now() - startedAt,
  };
  sendResponse(result);
  return true;
});
