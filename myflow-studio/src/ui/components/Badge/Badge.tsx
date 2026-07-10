import type { ReactNode } from "react";
import { cssClass } from "@ui/utils/cssModule";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: cssClass(styles.neutral),
  accent: cssClass(styles.accent),
  success: cssClass(styles.success),
  warning: cssClass(styles.warning),
  danger: cssClass(styles.danger),
  info: cssClass(styles.info),
};

export function Badge({ tone = "neutral", dot = false, children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${toneClass[tone]}`}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
