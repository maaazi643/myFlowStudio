import { Badge, ProgressBar } from "@ui/components";
import type { QueueRun } from "@shared/types/queue";
import { estimateRemainingMs, formatDuration } from "@shared/utils/queueEta";
import styles from "./QueueProgress.module.css";

export interface QueueProgressProps {
  run: QueueRun;
}

const TERMINAL_STATUSES = new Set(["completed", "failed", "skipped"]);

export function QueueProgress({ run }: QueueProgressProps) {
  const total = run.items.length;
  const done = run.items.filter((item) => TERMINAL_STATUSES.has(item.status)).length;
  const failedCount = run.items.filter((item) => item.status === "failed").length;
  const remainingMs = estimateRemainingMs(run.items);

  return (
    <div className={styles.wrap}>
      <ProgressBar value={done} max={total} label="Progress" />
      <div className={styles.meta}>
        <span>
          {done} / {total} done
        </span>
        {failedCount > 0 ? <Badge tone="danger">{failedCount} failed</Badge> : null}
        {remainingMs !== null && run.status === "running" ? (
          <span>~{formatDuration(remainingMs)} remaining</span>
        ) : null}
      </div>
    </div>
  );
}
