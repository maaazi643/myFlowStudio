import { Badge, Button } from "@ui/components";
import type { BadgeTone } from "@ui/components";
import type { QueueItem, QueueItemStatus } from "@shared/types/queue";
import styles from "./QueueItemRow.module.css";

export interface QueueItemRowProps {
  item: QueueItem;
  index: number;
  onRetry: () => void;
}

const STATUS_TONE: Record<QueueItemStatus, BadgeTone> = {
  pending: "neutral",
  processing: "info",
  completed: "success",
  failed: "danger",
  skipped: "warning",
};

export function QueueItemRow({ item, index, onRetry }: QueueItemRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.index}>{index + 1}</span>
      <p className={styles.text} title={item.promptText}>
        {item.promptText}
      </p>
      <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
      {item.status === "failed" ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          aria-label={`Retry item ${String(index + 1)}`}
        >
          ↻
        </Button>
      ) : null}
    </div>
  );
}
