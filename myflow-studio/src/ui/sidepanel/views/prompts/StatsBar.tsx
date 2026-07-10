import { Badge } from "@ui/components";
import type { PromptStats } from "@shared/utils/promptStats";
import styles from "./StatsBar.module.css";

export interface StatsBarProps {
  stats: PromptStats;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className={styles.bar}>
      <Stat label="Prompts" value={stats.count} />
      <Stat label="Images to generate" value={stats.totalImages} />
      <Stat label="Avg. length" value={`${String(stats.averageLength)} chars`} />
      {stats.emptyCount > 0 ? <Badge tone="warning">{stats.emptyCount} empty</Badge> : null}
    </div>
  );
}
