import type { AutomationExecutor } from "@shared/automation/executor";
import type { BroadcastEvent } from "@shared/messaging/messages";
import type { QueueRunsRepository } from "@shared/storage/indexedDb/repositories";
import type { GenerationSettings } from "@shared/types/generationSettings";
import type { Prompt } from "@shared/types/prompt";
import type { QueueItem, QueueRun } from "@shared/types/queue";
import { buildQueueItems } from "@shared/utils/queueBuilder";
import { getSpeedProfile } from "@shared/config/speedProfiles";

export interface QueueEngineDeps {
  repo: QueueRunsRepository;
  executor: AutomationExecutor;
  broadcast: (event: BroadcastEvent) => void;
  delay?: (ms: number) => Promise<void>;
  random?: () => number;
}

const DEFAULT_RETRY_BACKOFF_MS = { min: 2000, max: 4000 };

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * The sole authority over queue state (per the architecture doc) — the
 * background service worker owns this, the UI only ever reads it via
 * broadcast events and issues commands over the M3 message bus. Every
 * mutation is persisted before the next await, so a service worker
 * termination mid-item never loses more than that one item's progress.
 */
export class QueueEngine {
  private run: QueueRun | null = null;
  private processing = false;
  /** Set when loop() is called while a previous invocation is still in its final await — see loop(). */
  private loopRequested = false;
  private skipRequestedItemId: string | null = null;
  private readonly repo: QueueRunsRepository;
  private readonly executor: AutomationExecutor;
  private readonly broadcast: (event: BroadcastEvent) => void;
  private readonly delay: (ms: number) => Promise<void>;
  private readonly random: () => number;

  constructor(deps: QueueEngineDeps) {
    this.repo = deps.repo;
    this.executor = deps.executor;
    this.broadcast = deps.broadcast;
    this.delay = deps.delay ?? defaultDelay;
    this.random = deps.random ?? Math.random;
  }

  /** Call once at background startup — re-hydrates an in-progress run rather than losing it. */
  async initialize(): Promise<void> {
    const active = await this.repo.getActive();
    if (!active) {
      return;
    }
    if (active.status === "running") {
      // A "running" run found at startup means the previous service worker
      // died mid-flight — we can't know how far it got, so never silently
      // resume automation; require an explicit Resume.
      active.status = "paused";
      active.updatedAt = Date.now();
      await this.repo.put(active);
    }
    this.run = active;
    this.emit();
  }

  getState(): QueueRun | null {
    return this.run;
  }

  async start(prompts: readonly Prompt[], settings: GenerationSettings): Promise<QueueRun> {
    const now = Date.now();
    const run: QueueRun = {
      id: crypto.randomUUID(),
      status: "running",
      items: buildQueueItems(prompts, settings.imagesPerPrompt),
      settingsSnapshot: settings,
      createdAt: now,
      updatedAt: now,
    };
    this.run = run;
    await this.persistAndEmit();
    void this.loop();
    return run;
  }

  pause(): void {
    if (!this.run || this.run.status !== "running") {
      return;
    }
    this.run.status = "paused";
    void this.persistAndEmit();
  }

  resume(): void {
    if (!this.run || this.run.status !== "paused") {
      return;
    }
    this.run.status = "running";
    void this.persistAndEmit();
    void this.loop();
  }

  stop(): void {
    if (!this.run || (this.run.status !== "running" && this.run.status !== "paused")) {
      return;
    }
    this.run.status = "stopped";
    void this.persistAndEmit();
  }

  skipCurrent(): void {
    const current = this.run?.items.find((item) => item.status === "processing");
    if (current) {
      this.skipRequestedItemId = current.id;
    }
  }

  retryItem(itemId: string): void {
    this.requeueFailed((item) => item.id === itemId);
  }

  retryAllFailed(): void {
    this.requeueFailed(() => true);
  }

  retrySelected(itemIds: readonly string[]): void {
    const ids = new Set(itemIds);
    this.requeueFailed((item) => ids.has(item.id));
  }

  /** Requeuing failed items always resumes the run — reviewing a finished run and hitting Retry should just continue it. */
  private requeueFailed(matches: (item: QueueItem) => boolean): void {
    if (!this.run) {
      return;
    }
    let changed = false;
    for (const item of this.run.items) {
      if (item.status === "failed" && matches(item)) {
        item.status = "pending";
        item.error = undefined;
        changed = true;
      }
    }
    if (!changed) {
      return;
    }
    this.run.status = "running";
    void this.persistAndEmit();
    void this.loop();
  }

  private async persistAndEmit(): Promise<void> {
    if (!this.run) {
      return;
    }
    this.run.updatedAt = Date.now();
    await this.repo.put(this.run);
    this.emit();
  }

  private emit(): void {
    if (this.run) {
      this.broadcast({ type: "QUEUE_PROGRESS", run: this.run });
    }
  }

  private async loop(): Promise<void> {
    if (this.processing) {
      // A command (retry, resume, ...) arrived while the current invocation
      // is still finishing its last persist/broadcast — don't drop it, the
      // finally block below will re-invoke loop() once it's free.
      this.loopRequested = true;
      return;
    }
    this.processing = true;
    try {
      while (this.run && this.run.status === "running") {
        const next = this.run.items.find((item) => item.status === "pending");
        if (!next) {
          this.run.status = "completed";
          await this.persistAndEmit();
          break;
        }

        if (next.attempts > 0) {
          // This is a retry, not a first attempt — wait the speed profile's
          // backoff band rather than diving straight back in.
          const { min, max } =
            getSpeedProfile(this.run.settingsSnapshot.speedProfileId)?.retryBackoffMs ??
            DEFAULT_RETRY_BACKOFF_MS;
          await this.delay(min + this.random() * (max - min));
          // pause()/stop() can run (via a message handler) while the delay
          // above is in flight — tsc's narrowing of this.run.status from
          // the while condition doesn't account for that.
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (this.run.status !== "running") {
            // Paused/stopped during the backoff wait — the item is still
            // "pending", nothing to finalize.
            break;
          }
        }

        next.status = "processing";
        next.startedAt = Date.now();
        next.attempts += 1;
        await this.persistAndEmit();

        const result = await this.executor.generate({
          promptText: next.promptText,
          referenceImageIds: next.referenceImageIds,
          settings: this.run.settingsSnapshot,
        });

        if (this.skipRequestedItemId === next.id) {
          next.status = "skipped";
          next.error = undefined;
          this.skipRequestedItemId = null;
          // pause()/stop() are public methods a message handler can call
          // while the await above is in flight — tsc's narrowing of
          // this.run.status from the while condition doesn't account for
          // that, but the run genuinely can have been paused/stopped here.
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (this.run.status !== "running") {
          // Paused/stopped while this item was in flight — requeue rather
          // than finalize, so resuming picks it back up.
          next.status = result.ok ? "completed" : "pending";
          next.error = result.ok ? undefined : result.error;
        } else if (result.ok) {
          next.status = "completed";
          next.error = undefined;
        } else {
          const maxRetries =
            getSpeedProfile(this.run.settingsSnapshot.speedProfileId)?.maxRetries ?? 3;
          next.status = next.attempts <= maxRetries ? "pending" : "failed";
          next.error = result.error;
        }
        next.completedAt = Date.now();
        await this.persistAndEmit();
      }
    } finally {
      this.processing = false;
      if (this.loopRequested) {
        this.loopRequested = false;
        void this.loop();
      }
    }
  }
}
