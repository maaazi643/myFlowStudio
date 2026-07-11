import { useMemo, useState } from "react";
import { Button, Select } from "@ui/components";
import { useLogs } from "@ui/hooks/useLogs";
import type { LogLevel } from "@shared/types/logEntry";
import { LogRow } from "./logs/LogRow";
import styles from "./LogsView.module.css";

type LevelFilter = LogLevel | "all";

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
];

export function LogsView() {
  const { logs, loading, clear } = useLogs();
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const filtered = useMemo(
    () => (levelFilter === "all" ? logs : logs.filter((entry) => entry.level === levelFilter)),
    [logs, levelFilter],
  );

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>
        Every automation step — content script startup, selector lookups, prompt insertion, button
        clicks, and failures — is recorded here as it happens.
      </p>

      <div className={styles.toolbar}>
        <Select
          aria-label="Filter by level"
          value={levelFilter}
          onChange={(event) => {
            setLevelFilter(event.target.value as LevelFilter);
          }}
          options={LEVEL_OPTIONS}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={logs.length === 0}
          onClick={() => {
            void clear();
          }}
        >
          Clear
        </Button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading logs…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>
          {logs.length === 0
            ? "No log entries yet. Run the queue or capture a selector in Developer Mode to see activity here."
            : "No entries at this level."}
        </p>
      ) : (
        <div className={styles.list}>
          {filtered.map((entry) => (
            <LogRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
