import type { GenerationSettings } from "./generationSettings";

export type QueueItemStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

/**
 * One item per generated image, not per prompt — a prompt with
 * imagesPerPrompt > 1 expands into several items. promptText is the
 * variable-resolved text captured when the queue was built, so editing a
 * prompt afterward can't shift a run that's already in progress.
 */
export interface QueueItem {
  id: string;
  promptId: string;
  promptText: string;
  /** Snapshot of the prompt's reference images at build time — same rationale as promptText. */
  referenceImageIds?: string[] | undefined;
  imageIndexForPrompt: number;
  globalIndex: number;
  status: QueueItemStatus;
  attempts: number;
  error?: string | undefined;
  startedAt?: number | undefined;
  completedAt?: number | undefined;
}

export type QueueRunStatus = "running" | "paused" | "stopped" | "completed";

export interface QueueRun {
  id: string;
  status: QueueRunStatus;
  items: QueueItem[];
  /** Settings at the moment Start was pressed — a run's behavior doesn't drift if Settings change mid-run. */
  settingsSnapshot: GenerationSettings;
  createdAt: number;
  updatedAt: number;
}
