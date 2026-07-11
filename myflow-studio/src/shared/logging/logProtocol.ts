import type { LogLevel } from "@shared/types/logEntry";

/**
 * A content script can't write to the extension's own IndexedDB directly
 * (chrome.storage/IndexedDB in a content script is scoped to the *page's*
 * origin, not chrome-extension://) — so log lines it produces have to be
 * relayed to the background over chrome.runtime.sendMessage, the same way
 * capture/automation results already are.
 */
export interface LogMessage {
  type: "MYFLOW_LOG";
  level: LogLevel;
  message: string;
  context?: Record<string, string> | undefined;
}

export function isLogMessage(value: unknown): value is LogMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "MYFLOW_LOG"
  );
}
