import type { CaptureController } from "./captureController";

/** The one call in this module that touches the real chrome API — everything else is pure/testable. */
export function attachContentBridgeToRuntime(controller: CaptureController): void {
  chrome.runtime.onMessage.addListener((message) => {
    controller.handleContentMessage(message);
  });
}
