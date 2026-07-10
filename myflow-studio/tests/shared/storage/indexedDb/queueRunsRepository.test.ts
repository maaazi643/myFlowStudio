import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDatabaseConnectionForTests } from "@shared/storage/indexedDb/db";
import { createQueueRunsRepository } from "@shared/storage/indexedDb/repositories";
import type { QueueRun } from "@shared/types/queue";
import type { GenerationSettings } from "@shared/types/generationSettings";

const SETTINGS_SNAPSHOT: GenerationSettings = {
  speedProfileId: "balanced",
  imagesPerPrompt: 1,
  aspectRatioId: "16:9",
  modelId: "flow-standard",
  qualityId: "standard",
  autoDownload: true,
  startNumber: 1,
  numberPadding: 4,
  filenameTemplate: "numbered",
};

function makeRun(overrides: Partial<QueueRun>): QueueRun {
  return {
    id: crypto.randomUUID(),
    status: "running",
    items: [],
    settingsSnapshot: SETTINGS_SNAPSHOT,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

beforeEach(() => {
  resetDatabaseConnectionForTests();
});

afterEach(async () => {
  resetDatabaseConnectionForTests();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("myflow-studio");
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(new Error("Failed to reset the test database."));
    };
  });
});

describe("queueRunsRepository.getActive", () => {
  it("returns undefined when there is no run in progress", async () => {
    const repo = createQueueRunsRepository();
    await expect(repo.getActive()).resolves.toBeUndefined();
  });

  it("returns a running or paused run but not completed/stopped ones", async () => {
    const repo = createQueueRunsRepository();
    const running = makeRun({ status: "running", updatedAt: 1 });
    const completed = makeRun({ status: "completed", updatedAt: 2 });
    await Promise.all([repo.put(running), repo.put(completed)]);

    await expect(repo.getActive()).resolves.toEqual(running);
  });

  it("returns the most recently updated in-progress run", async () => {
    const repo = createQueueRunsRepository();
    const older = makeRun({ status: "paused", updatedAt: 1 });
    const newer = makeRun({ status: "running", updatedAt: 2 });
    await Promise.all([repo.put(older), repo.put(newer)]);

    await expect(repo.getActive()).resolves.toEqual(newer);
  });
});

describe("queueRunsRepository.getHistory", () => {
  it("returns only finished runs, newest first, capped at the limit", async () => {
    const repo = createQueueRunsRepository();
    const active = makeRun({ status: "running", updatedAt: 10 });
    const runs = [
      makeRun({ status: "completed", updatedAt: 3 }),
      makeRun({ status: "stopped", updatedAt: 5 }),
      makeRun({ status: "completed", updatedAt: 1 }),
    ];
    await Promise.all([repo.put(active), ...runs.map((run) => repo.put(run))]);

    const history = await repo.getHistory(2);
    expect(history.map((run) => run.updatedAt)).toEqual([5, 3]);
  });
});
