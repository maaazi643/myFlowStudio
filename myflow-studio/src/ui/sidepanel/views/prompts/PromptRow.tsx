import { Button, Checkbox } from "@ui/components";
import { resolvePromptText } from "@shared/utils/promptVariables";
import type { Prompt } from "@shared/types/prompt";
import styles from "./PromptRow.module.css";

export interface PromptRowProps {
  prompt: Prompt;
  index: number;
  selected: boolean;
  showReorder: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleSelected: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function PromptRow({
  prompt,
  index,
  selected,
  showReorder,
  canMoveUp,
  canMoveDown,
  onToggleSelected,
  onEdit,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: PromptRowProps) {
  const resolved = resolvePromptText(prompt.text, prompt.variables);
  const variableCount = prompt.variables ? Object.keys(prompt.variables).length : 0;
  const referenceCount = prompt.referenceImageIds?.length ?? 0;

  return (
    <div className={styles.row}>
      <div className={styles.checkboxWrap}>
        <Checkbox
          aria-label={`Select prompt ${String(index + 1)}`}
          checked={selected}
          onChange={onToggleSelected}
        />
      </div>
      <button
        type="button"
        className={styles.content}
        onClick={onEdit}
        aria-label={`Edit prompt ${String(index + 1)}`}
      >
        <p className={styles.text}>{resolved}</p>
        <p className={styles.meta}>
          {prompt.text.length} chars
          {variableCount > 0
            ? ` · ${String(variableCount)} variable${variableCount === 1 ? "" : "s"}`
            : ""}
          {referenceCount > 0
            ? ` · ${String(referenceCount)} reference${referenceCount === 1 ? "" : "s"}`
            : ""}
        </p>
      </button>
      <div className={styles.actions}>
        {showReorder ? (
          <div className={styles.actionsRow}>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              aria-label="Move prompt up"
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              aria-label="Move prompt down"
            >
              ↓
            </Button>
          </div>
        ) : null}
        <div className={styles.actionsRow}>
          <Button variant="ghost" size="sm" onClick={onDuplicate} aria-label="Duplicate prompt">
            ⧉
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete prompt">
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}
