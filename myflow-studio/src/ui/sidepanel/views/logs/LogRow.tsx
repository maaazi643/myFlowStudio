import { Badge } from "@ui/components";
import type { BadgeTone } from "@ui/components";
import type { LogEntry } from "@shared/types/logEntry";
import styles from "./LogRow.module.css";

const LEVEL_TONE: Record<LogEntry["level"], BadgeTone> = {
  info: "neutral",
  warning: "warning",
  error: "danger",
};

export interface LogRowProps {
  entry: LogEntry;
}

export function LogRow({ entry }: LogRowProps) {
  const contextEntries = entry.context ? Object.entries(entry.context) : [];

  return (
    <div className={styles.row}>
      <Badge tone={LEVEL_TONE[entry.level]}>{entry.level}</Badge>
      <div className={styles.main}>
        <p className={styles.message}>{entry.message}</p>
        <div className={styles.meta}>
          <span className={styles.time}>{new Date(entry.createdAt).toLocaleTimeString()}</span>
          {contextEntries.map(([key, value]) => (
            <span key={key} className={styles.context}>
              {key}={value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
