import type { ReactNode } from "react";
import styles from "./Field.module.css";

export interface FieldProps {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}

/** Label + control + hint/error, for controls (Select, SegmentedControl, …) that don't own that chrome themselves. */
export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? (
        <p className={styles.error}>{error}</p>
      ) : hint ? (
        <p className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  );
}
