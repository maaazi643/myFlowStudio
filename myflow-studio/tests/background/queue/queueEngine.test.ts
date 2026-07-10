import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueueEngine } from "@background/queue/queueEngine";
import { resetDatabaseConnectionForTests } from "@shared/storage/indexedDb/db";
import { createQueueRunsRepository } from "@shared/storage/indexedDb/repositories";
import type {
  AutomationExecutor,
  AutomationRequest,
  AutomationResult,
} from "@shared/automation/executor";
import type { GenerationSettings } from "@shared/types/generationSettings";
import type { Prompt } from "@shared/types/prompt";

const SETTINGS: GenerationSettings = {
  // "fast" profile: maxRetries 2 — keeps the retry-exhaustion tests short.
  speedProfileId: "fast",
  imagesPerPrompt: 1,
  aspectRatioId: "16:9",
  modelId: "flow-standard",
  qualityId: "standard",
  autoDownload: true,
  startNumber: 1,
  numberPadding: 4,
  filenameTemplate: "numbered",
};

function makePrompt(overrides: Partial<Prompt>): Prompt {
  return {
    id: crypto.randomUUID(),
    projectId: null,
    text: "a prompt",
    order: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

/** An executor whose generate() calls stay pending until the test resolves them explicitly. */
function createControllableExecutor(): {
  executor: AutomationExecutor;
  calls: AutomationRequest[];
  pendingCount: () => number;
  resolveNext: (result: AutomationResult) => void;
} {
  const resolvers: Array<(result: AutomationResult) => void> = [];
  const calls: AutomationRequest[] = [];
  return {
    calls,
    executor: {
      generate: (request) => {
        calls.push(request);
        return new Promise<AutomationResult>((resolve) => {
          resolvers.push(resolve);
        });
      },
    },
    pendingCount: () => resolvers.length,
    resolveNext: (result) => {
      const resolve = resolvers.shift();
      if (!resolve) {
        throw new Error("No pending generate() call to resolve.");
      }
      resolve(result);
    },
  };
}

/** Stands in for QueueEngine's real (setTimeout-based) delay/backoff wait. */
function noDelay(): Promise<void> {
  return Promise.resolve();
}

// fake-indexeddb dispatches request events via a macrotask, not just a
// microtask, so waiting only on Promise.resolve() can spin forever without
// ever letting a pending IDBRequest actually settle.
async function waitUntil(condition: () => boolean, maxTicks = 200): Promise<void> {
  for (let tick = 0; tick < maxTicks; tick += 1) {
    if (condition()) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
  throw new Error("Condition was not met in time.");
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

describe("QueueEngine", () => {
  it("processes items sequentially to completion on success", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const broadcast = vi.fn();
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast,
      delay: noDelay,
      random: () => 0.5,
    });

    const run = await engine.start(
      [makePrompt({ text: "a fox" }), makePrompt({ text: "a jellyfish" })],
      SETTINGS,
    );
    expect(run.items).toHaveLength(2);
    expect(broadcast).toHaveBeenCalled();

    await waitUntil(() => ctrl.pendingCount() === 1);
    expect(engine.getState()?.items[0]?.status).toBe("processing");
    ctrl.resolveNext({ ok: true });

    await waitUntil(() => ctrl.pendingCount() === 1);
    expect(engine.getState()?.items[0]?.status).toBe("completed");
    expect(engine.getState()?.items[1]?.status).toBe("processing");
    ctrl.resolveNext({ ok: true });

    await waitUntil(() => engine.getState()?.status === "completed");
    expect(engine.getState()?.items.every((item) => item.status === "completed")).toBe(true);

    // Autosave: the persisted copy matches in-memory state.
    const persisted = await repo.getById(run.id);
    expect(persisted?.status).toBe("completed");
  });

  it("retries a failing item up to the speed profile's maxRetries, then marks it failed", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast: vi.fn(),
      delay: noDelay,
      random: () => 0.5,
    });

    await engine.start([makePrompt({ text: "a fox" })], SETTINGS);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await waitUntil(() => ctrl.pendingCount() === 1);
      ctrl.resolveNext({ ok: false, error: "boom" });
    }

    await waitUntil(() => engine.getState()?.items[0]?.status === "failed");
    expect(engine.getState()?.items[0]?.attempts).toBe(3);
    expect(engine.getState()?.items[0]?.error).toBe("boom");
    // No more pending items — the run finishes even though the item failed.
    expect(engine.getState()?.status).toBe("completed");
  });

  it("waits the speed profile's retryBackoffMs before a retry, but not before a first attempt", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const delaySpy = vi.fn((_ms: number) => Promise.resolve());
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast: vi.fn(),
      delay: delaySpy,
      random: () => 0.5,
    });

    await engine.start([makePrompt({ text: "a fox" })], SETTINGS);
    await waitUntil(() => ctrl.pendingCount() === 1);
    expect(delaySpy).not.toHaveBeenCalled();

    ctrl.resolveNext({ ok: false, error: "boom" });
    await waitUntil(() => ctrl.pendingCount() === 1);

    expect(delaySpy).toHaveBeenCalledTimes(1);
    const waitedMs = delaySpy.mock.calls[0]?.[0] as number;
    // "fast" profile retryBackoffMs: 2000-4000ms.
    expect(waitedMs).toBeGreaterThanOrEqual(2000);
    expect(waitedMs).toBeLessThanOrEqual(4000);
  });

  it("recovers after an intermittent failure within the retry budget", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast: vi.fn(),
      delay: noDelay,
      random: () => 0.5,
    });

    await engine.start([makePrompt({ text: "a fox" })], SETTINGS);

    await waitUntil(() => ctrl.pendingCount() === 1);
    ctrl.resolveNext({ ok: false, error: "transient" });

    await waitUntil(() => ctrl.pendingCount() === 1);
    ctrl.resolveNext({ ok: true });

    await waitUntil(() => engine.getState()?.status === "completed");
    expect(engine.getState()?.items[0]?.status).toBe("completed");
    expect(engine.getState()?.items[0]?.attempts).toBe(2);
  });

  it("pause stops the loop after the in-flight item finishes; resume continues it", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast: vi.fn(),
      delay: noDelay,
      random: () => 0.5,
    });

    await engine.start(
      [makePrompt({ text: "a fox" }), makePrompt({ text: "a jellyfish" })],
      SETTINGS,
    );

    await waitUntil(() => ctrl.pendingCount() === 1);
    engine.pause();
    ctrl.resolveNext({ ok: true });

    await waitUntil(() => engine.getState()?.status === "paused");
    expect(engine.getState()?.items[0]?.status).toBe("completed");
    expect(engine.getState()?.items[1]?.status).toBe("pending");
    expect(ctrl.pendingCount()).toBe(0);

    engine.resume();
    await waitUntil(() => ctrl.pendingCount() === 1);
    expect(engine.getState()?.items[1]?.status).toBe("processing");
    ctrl.resolveNext({ ok: true });

    await waitUntil(() => engine.getState()?.status === "completed");
  });

  it("stop halts the run, and resume() has no effect on a stopped run", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast: vi.fn(),
      delay: noDelay,
      random: () => 0.5,
    });

    await engine.start(
      [makePrompt({ text: "a fox" }), makePrompt({ text: "a jellyfish" })],
      SETTINGS,
    );
    await waitUntil(() => ctrl.pendingCount() === 1);
    engine.stop();
    ctrl.resolveNext({ ok: true });

    await waitUntil(() => engine.getState()?.status === "stopped");
    engine.resume();
    expect(engine.getState()?.status).toBe("stopped");
    expect(engine.getState()?.items[1]?.status).toBe("pending");
  });

  it("skipCurrent marks the in-flight item skipped regardless of the executor's result", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast: vi.fn(),
      delay: noDelay,
      random: () => 0.5,
    });

    await engine.start([makePrompt({ text: "a fox" })], SETTINGS);
    await waitUntil(() => ctrl.pendingCount() === 1);
    engine.skipCurrent();
    ctrl.resolveNext({ ok: true });

    await waitUntil(() => engine.getState()?.status === "completed");
    expect(engine.getState()?.items[0]?.status).toBe("skipped");
  });

  it("retryAllFailed requeues failed items and resumes a completed run", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast: vi.fn(),
      delay: noDelay,
      random: () => 0.5,
    });

    await engine.start([makePrompt({ text: "a fox" })], SETTINGS);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await waitUntil(() => ctrl.pendingCount() === 1);
      ctrl.resolveNext({ ok: false, error: "boom" });
    }
    await waitUntil(() => engine.getState()?.status === "completed");
    expect(engine.getState()?.items[0]?.status).toBe("failed");

    engine.retryAllFailed();
    await waitUntil(() => ctrl.pendingCount() === 1);
    expect(engine.getState()?.items[0]?.status).toBe("processing");
    ctrl.resolveNext({ ok: true });

    await waitUntil(() => engine.getState()?.status === "completed");
    expect(engine.getState()?.items[0]?.status).toBe("completed");
  });

  it("retryItem only requeues the matching item", async () => {
    const repo = createQueueRunsRepository();
    const ctrl = createControllableExecutor();
    const engine = new QueueEngine({
      repo,
      executor: ctrl.executor,
      broadcast: vi.fn(),
      delay: noDelay,
      random: () => 0.5,
    });

    await engine.start(
      [makePrompt({ text: "a fox" }), makePrompt({ text: "a jellyfish" })],
      SETTINGS,
    );
    // Fail the first item to exhaustion; succeed the second.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await waitUntil(() => ctrl.pendingCount() === 1);
      ctrl.resolveNext({ ok: false, error: "boom" });
    }
    await waitUntil(() => ctrl.pendingCount() === 1);
    ctrl.resolveNext({ ok: true });
    await waitUntil(() => engine.getState()?.status === "completed");

    const failedId = engine.getState()?.items[0]?.id;
    expect(failedId).toBeDefined();

    engine.retryItem(failedId as string);
    await waitUntil(() => ctrl.pendingCount() === 1);
    expect(engine.getState()?.items[0]?.status).toBe("processing");
    expect(engine.getState()?.items[1]?.status).toBe("completed");
    ctrl.resolveNext({ ok: true });
    await waitUntil(() => engine.getState()?.status === "completed");
  });

  it("initialize() re-hydrates a persisted active run and downgrades 'running' to 'paused'", async () => {
    const repo = createQueueRunsRepository();
    const staleRun = {
      id: crypto.randomUUID(),
      status: "running" as const,
      items: [],
      settingsSnapshot: SETTINGS,
      createdAt: 0,
      updatedAt: 0,
    };
    await repo.put(staleRun);

    const broadcast = vi.fn();
    const engine = new QueueEngine({
      repo,
      executor: createControllableExecutor().executor,
      broadcast,
    });
    await engine.initialize();

    expect(engine.getState()?.status).toBe("paused");
    expect(broadcast).toHaveBeenCalledWith({
      type: "QUEUE_PROGRESS",
      run: expect.objectContaining({ status: "paused" }) as unknown,
    });
    const persisted = await repo.getById(staleRun.id);
    expect(persisted?.status).toBe("paused");
  });

  it("initialize() is a no-op when there's no active run", async () => {
    const repo = createQueueRunsRepository();
    const engine = new QueueEngine({
      repo,
      executor: createControllableExecutor().executor,
      broadcast: vi.fn(),
    });
    await engine.initialize();
    expect(engine.getState()).toBeNull();
  });
});
