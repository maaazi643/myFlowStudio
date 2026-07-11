import type { LogEntry } from "@shared/types/logEntry";
import { createRepository } from "../createRepository";
import type { Repository } from "../createRepository";
import { openDatabase, STORES } from "../db";

export interface LogsRepository extends Repository<LogEntry> {
  /** Newest first, via a cursor over the createdAt index rather than a full scan. */
  getRecent(limit: number): Promise<LogEntry[]>;
  /** Wipes every stored log entry. */
  clear(): Promise<void>;
}

export function createLogsRepository(): LogsRepository {
  return {
    ...createRepository<LogEntry>(STORES.logs),
    clear: async () => {
      const db = await openDatabase();
      const tx = db.transaction(STORES.logs, "readwrite");
      tx.objectStore(STORES.logs).clear();
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
          resolve();
        };
        tx.onerror = () => {
          reject(new Error(tx.error?.message ?? "Failed to clear logs."));
        };
      });
    },
    getRecent: async (limit) => {
      const db = await openDatabase();
      const tx = db.transaction(STORES.logs, "readonly");
      const index = tx.objectStore(STORES.logs).index("createdAt");
      const results: LogEntry[] = [];

      return new Promise((resolve, reject) => {
        const request = index.openCursor(null, "prev");
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor && results.length < limit) {
            results.push(cursor.value as LogEntry);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => {
          reject(new Error(request.error?.message ?? "Failed to read recent logs."));
        };
      });
    },
  };
}
