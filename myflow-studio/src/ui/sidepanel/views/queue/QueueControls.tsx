import { Button } from "@ui/components";
import type { QueueRun } from "@shared/types/queue";
import styles from "./QueueControls.module.css";

export interface QueueControlsProps {
  run: QueueRun | null;
  starting: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: () => void;
  onRetryAllFailed: () => void;
}

export function QueueControls({
  run,
  starting,
  onStart,
  onPause,
  onResume,
  onStop,
  onSkip,
  onRetryAllFailed,
}: QueueControlsProps) {
  const hasFailed = run?.items.some((item) => item.status === "failed") ?? false;

  if (!run || run.status === "completed" || run.status === "stopped") {
    return (
      <div className={styles.row}>
        <Button onClick={onStart} disabled={starting}>
          {starting ? "Starting…" : run ? "Start new run" : "Start"}
        </Button>
        {hasFailed ? (
          <Button variant="secondary" onClick={onRetryAllFailed}>
            Retry failed
          </Button>
        ) : null}
      </div>
    );
  }

  if (run.status === "paused") {
    return (
      <div className={styles.row}>
        <Button onClick={onResume}>Resume</Button>
        <Button variant="secondary" onClick={onStop}>
          Stop
        </Button>
        {hasFailed ? (
          <Button variant="secondary" onClick={onRetryAllFailed}>
            Retry failed
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <Button variant="secondary" onClick={onPause}>
        Pause
      </Button>
      <Button variant="ghost" onClick={onSkip}>
        Skip
      </Button>
      <Button variant="danger" onClick={onStop}>
        Stop
      </Button>
    </div>
  );
}
