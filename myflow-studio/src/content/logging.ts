import type { LogMessage } from "@shared/logging/logProtocol";
import type { LogLevel } from "@shared/types/logEntry";

function send(level: LogLevel, message: string, context?: Record<string, string>): void {
  const payload: LogMessage = { type: "MYFLOW_LOG", level, message, context };
  chrome.runtime.sendMessage(payload).catch(() => undefined);
}

/** Sends a log line to the background, which persists it and broadcasts it to the Logs tab. */
export const log = {
  info: (message: string, context?: Record<string, string>) => {
    send("info", message, context);
  },
  warning: (message: string, context?: Record<string, string>) => {
    send("warning", message, context);
  },
  error: (message: string, context?: Record<string, string>) => {
    send("error", message, context);
  },
};
