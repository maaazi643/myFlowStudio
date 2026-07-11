import type { MessageRouter } from "../messaging/router";
import type { CaptureController } from "./captureController";

export function registerDevModeHandlers(
  router: MessageRouter,
  controller: CaptureController,
): void {
  router.registerHandler("DEV_CAPTURE_START", (message) => controller.startCapture(message.role));
  router.registerHandler("DEV_CAPTURE_CANCEL", () => controller.cancelCapture());
}
