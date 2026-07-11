import { isLogMessage } from "@shared/logging/logProtocol";
import type { Logger } from "./logger";

/** Relays log lines the content script sends over chrome.runtime.sendMessage into the shared Logger. */
export function attachLogBridgeToRuntime(logger: Logger): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (!isLogMessage(message)) {
      return;
    }
    if (message.level === "error") {
      logger.error(message.message, message.context);
    } else if (message.level === "warning") {
      logger.warning(message.message, message.context);
    } else {
      logger.info(message.message, message.context);
    }
  });
}
