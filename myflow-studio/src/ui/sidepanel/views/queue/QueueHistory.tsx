import { Badge } from "@ui/components";
import type { QueueRun } from "@shared/types/queue";
import styles from "./QueueHistory.module.css";

export interface QueueHistoryProps {
  runs: QueueRun[];
}

export function QueueHistory({ runs }: QueueHistoryProps) {
  if (runs.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>Recent runs</h3>
      {runs.map((run) => {
        const total = run.items.length;
        const completed = run.items.filter((item) => item.status === "completed").length;
        const failed = run.items.filter((item) => item.status === "failed").length;
        return (
          <div key={run.id} className={styles.row}>
            <span className={styles.date}>{new Date(run.createdAt).toLocaleString()}</span>
            <span>
              {completed} / {total} completed
            </span>
            {failed > 0 ? <Badge tone="danger">{failed} failed</Badge> : null}
            <Badge tone={run.status === "completed" ? "success" : "neutral"}>{run.status}</Badge>
          </div>
        );
      })}
    </div>
  );
}
