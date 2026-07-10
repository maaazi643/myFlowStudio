import { describe, expect, it } from "vitest";
import {
  computeAverageMsPerItem,
  estimateRemainingMs,
  formatDuration,
} from "@shared/utils/queueEta";
import type { QueueItem } from "@shared/types/queue";

function makeItem(overrides: Partial<QueueItem>): QueueItem {
  return {
    id: crypto.randomUUID(),
    promptId: "p1",
    promptText: "a fox",
    imageIndexForPrompt: 0,
    globalIndex: 0,
    status: "pending",
    attempts: 0,
    ...overrides,
  };
}

describe("computeAverageMsPerItem", () => {
  it("returns null when nothing has completed yet", () => {
    const items = [makeItem({ status: "pending" }), makeItem({ status: "processing" })];
    expect(computeAverageMsPerItem(items)).toBeNull();
  });

  it("averages the duration of completed items", () => {
    const items = [
      makeItem({ status: "completed", startedAt: 0, completedAt: 1000 }),
      makeItem({ status: "completed", startedAt: 0, completedAt: 3000 }),
    ];
    expect(computeAverageMsPerItem(items)).toBe(2000);
  });

  it("ignores non-completed items even if they have timestamps", () => {
    const items = [
      makeItem({ status: "completed", startedAt: 0, completedAt: 1000 }),
      makeItem({ status: "failed", startedAt: 0, completedAt: 5000 }),
    ];
    expect(computeAverageMsPerItem(items)).toBe(1000);
  });
});

describe("estimateRemainingMs", () => {
  it("returns null when there's no average yet", () => {
    expect(estimateRemainingMs([makeItem({ status: "pending" })])).toBeNull();
  });

  it("multiplies remaining item count by the observed average", () => {
    const items = [
      makeItem({ status: "completed", startedAt: 0, completedAt: 2000 }),
      makeItem({ status: "pending" }),
      makeItem({ status: "processing" }),
      makeItem({ status: "failed" }),
    ];
    // 2 remaining (pending + processing) * 2000ms average.
    expect(estimateRemainingMs(items)).toBe(4000);
  });

  it("returns 0 when nothing is left but an average exists", () => {
    const items = [makeItem({ status: "completed", startedAt: 0, completedAt: 2000 })];
    expect(estimateRemainingMs(items)).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formats sub-minute durations as seconds", () => {
    expect(formatDuration(45000)).toBe("45s");
  });

  it("formats multi-minute durations as minutes and seconds", () => {
    expect(formatDuration(125000)).toBe("2m 5s");
  });

  it("rounds to the nearest second", () => {
    expect(formatDuration(1499)).toBe("1s");
  });
});
