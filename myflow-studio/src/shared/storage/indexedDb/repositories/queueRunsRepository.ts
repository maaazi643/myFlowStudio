import type { QueueRun } from "@shared/types/queue";
import { createRepository } from "../createRepository";
import type { Repository } from "../createRepository";
import { STORES } from "../db";

export interface QueueRunsRepository extends Repository<QueueRun> {
  /** The most recently updated run still in progress, if any. */
  getActive(): Promise<QueueRun | undefined>;
  /** Finished runs (completed or stopped), most recent first. */
  getHistory(limit: number): Promise<QueueRun[]>;
}

export function createQueueRunsRepository(): QueueRunsRepository {
  const base = createRepository<QueueRun>(STORES.queueRuns);

  return {
    ...base,
    getActive: async () => {
      const all = await base.getAll();
      return all
        .filter((run) => run.status === "running" || run.status === "paused")
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    },
    getHistory: async (limit) => {
      const all = await base.getAll();
      return all
        .filter((run) => run.status === "completed" || run.status === "stopped")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit);
    },
  };
}
