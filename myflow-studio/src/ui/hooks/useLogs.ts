import { useEffect, useState } from "react";
import { connectToBackground } from "@shared/messaging/connect";
import { createLogsRepository } from "@shared/storage/indexedDb/repositories";
import type { LogEntry } from "@shared/types/logEntry";

const repo = createLogsRepository();
const HISTORY_LIMIT = 500;

export interface UseLogsResult {
  logs: LogEntry[];
  loading: boolean;
  clear: () => Promise<void>;
}

export function useLogs(): UseLogsResult {
  const [client] = useState(() => connectToBackground("logs"));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void repo.getRecent(HISTORY_LIMIT).then((entries) => {
      if (!cancelled) {
        setLogs(entries);
        setLoading(false);
      }
    });
    const unsubscribe = client.onEvent((event) => {
      if (event.type === "LOG_APPENDED") {
        setLogs((current) => [event.entry, ...current].slice(0, HISTORY_LIMIT));
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
      client.disconnect();
    };
  }, [client]);

  async function clear(): Promise<void> {
    await repo.clear();
    setLogs([]);
  }

  return { logs, loading, clear };
}
