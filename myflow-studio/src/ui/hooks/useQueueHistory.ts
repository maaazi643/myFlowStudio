import { useEffect, useState } from "react";
import { createQueueRunsRepository } from "@shared/storage/indexedDb/repositories";
import type { QueueRun } from "@shared/types/queue";

const HISTORY_LIMIT = 5;

/**
 * History is finished, static data — reading it straight from IndexedDB
 * (available in every extension context, not just the background) avoids
 * a pointless round trip through the message bus that owns the *active*
 * run's authority, not settled ones.
 */
export function useQueueHistory(refreshKey: unknown): QueueRun[] {
  const [history, setHistory] = useState<QueueRun[]>([]);

  useEffect(() => {
    let cancelled = false;
    const repo = createQueueRunsRepository();
    void repo.getHistory(HISTORY_LIMIT).then((runs) => {
      if (!cancelled) {
        setHistory(runs);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return history;
}
