import type { QueueItem } from "@shared/types/queue";

/** Mean wall-clock time of completed items, or null until at least one has finished. */
export function computeAverageMsPerItem(items: readonly QueueItem[]): number | null {
  const durations = items
    .filter(
      (item) =>
        item.status === "completed" &&
        item.startedAt !== undefined &&
        item.completedAt !== undefined,
    )
    .map((item) => (item.completedAt as number) - (item.startedAt as number));

  if (durations.length === 0) {
    return null;
  }
  return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
}

/** Remaining items (pending + in-flight) times the observed average — null if there's no average yet. */
export function estimateRemainingMs(items: readonly QueueItem[]): number | null {
  const averageMs = computeAverageMsPerItem(items);
  if (averageMs === null) {
    return null;
  }
  const remaining = items.filter(
    (item) => item.status === "pending" || item.status === "processing",
  ).length;
  return remaining * averageMs;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${String(seconds)}s`;
  }
  return `${String(minutes)}m ${String(seconds)}s`;
}
