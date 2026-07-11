import type { LogsRepository } from "@shared/storage/indexedDb/repositories";
import type { LogEntry, LogLevel } from "@shared/types/logEntry";
import type { MessageRouter } from "../messaging/router";

export interface Logger {
  info(message: string, context?: Record<string, string>): void;
  warning(message: string, context?: Record<string, string>): void;
  error(message: string, context?: Record<string, string>): void;
}

/**
 * The single place every automation step's log line ends up, whether it
 * was written directly by background code or relayed from the content
 * script over chrome.runtime.sendMessage (see logBridge.ts). Persists to
 * IndexedDB so the Logs tab has history across side panel reloads, and
 * broadcasts so an open side panel updates live without polling.
 */
export function createLogger(router: MessageRouter, repo: LogsRepository): Logger {
  function write(level: LogLevel, message: string, context?: Record<string, string>): void {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      level,
      message,
      createdAt: Date.now(),
      context,
    };
    void repo.put(entry).then(() => {
      router.broadcast({ type: "LOG_APPENDED", entry });
    });
  }

  return {
    info: (message, context) => {
      write("info", message, context);
    },
    warning: (message, context) => {
      write("warning", message, context);
    },
    error: (message, context) => {
      write("error", message, context);
    },
  };
}
