import { useId } from "react";
import { cssClass } from "@ui/utils/cssModule";
import styles from "./Toggle.module.css";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, hint, id }: ToggleProps) {
  const generatedId = useId();
  const toggleId = id ?? generatedId;

  return (
    <div className={styles.row}>
      <div>
        <label className={styles.label} htmlFor={toggleId}>
          {label}
        </label>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        className={[styles.track, checked ? cssClass(styles.trackOn) : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => {
          onChange(!checked);
        }}
      >
        <span
          className={[styles.thumb, checked ? cssClass(styles.thumbOn) : ""]
            .filter(Boolean)
            .join(" ")}
        />
      </button>
    </div>
  );
}
