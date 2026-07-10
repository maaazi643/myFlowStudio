import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cssClass } from "@ui/utils/cssModule";
import styles from "./Textarea.module.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
}

export function Textarea({ label, hint, error, id, className, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

  return (
    <div className={styles.field}>
      {label ? (
        <label className={styles.label} htmlFor={textareaId}>
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={[styles.textarea, error ? cssClass(styles.invalid) : "", className ?? ""]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <span id={`${textareaId}-error`} className={styles.error}>
          {error}
        </span>
      ) : hint ? (
        <span id={`${textareaId}-hint`} className={styles.hint}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
