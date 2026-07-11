import { Badge, Button } from "@ui/components";
import type { BadgeTone } from "@ui/components";
import type { CapturedSelector } from "@shared/devtools/registry";
import type { RoleDefinition } from "@shared/devtools/roles";
import styles from "./CaptureRow.module.css";

export interface CaptureRowProps {
  definition: RoleDefinition;
  captured: CapturedSelector | undefined;
  /** True while this row's role is the one currently waiting for a page click. */
  waiting: boolean;
  /** True while a different role is currently waiting for a page click. */
  disabled: boolean;
  onCapture: () => void;
  onCancel: () => void;
  onClear: () => void;
}

const CONFIDENCE_TONE: Record<CapturedSelector["confidence"], BadgeTone> = {
  high: "success",
  medium: "warning",
  low: "danger",
};

export function CaptureRow({
  definition,
  captured,
  waiting,
  disabled,
  onCapture,
  onCancel,
  onClear,
}: CaptureRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <div className={styles.heading}>
          <span className={styles.label}>{definition.label}</span>
          {captured ? (
            <Badge tone={CONFIDENCE_TONE[captured.confidence]}>
              {captured.confidence} confidence
            </Badge>
          ) : (
            <Badge tone="neutral">Not captured</Badge>
          )}
        </div>
        <p className={styles.description}>{definition.description}</p>
        {captured ? (
          <>
            <code className={styles.selector}>{captured.selector}</code>
            {captured.warning ? <p className={styles.warning}>{captured.warning}</p> : null}
          </>
        ) : null}
        {waiting ? (
          <p className={styles.waiting}>
            Click the {definition.label.toLowerCase()} on the page… (Esc to cancel)
          </p>
        ) : null}
      </div>
      <div className={styles.actions}>
        {waiting ? (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled={disabled} onClick={onCapture}>
            {captured ? "Re-capture" : "Capture"}
          </Button>
        )}
        {captured && !waiting ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label={`Clear ${definition.label}`}
          >
            ✕
          </Button>
        ) : null}
      </div>
    </div>
  );
}
