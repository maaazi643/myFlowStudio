import { useState } from "react";
import { Button, Input } from "@ui/components";
import styles from "./BulkActionsBar.module.css";

export interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onFindReplace: (find: string, replace: string) => void;
}

export function BulkActionsBar({ count, onClear, onDelete, onFindReplace }: BulkActionsBarProps) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");

  function handleReplace(): void {
    if (!find) {
      return;
    }
    onFindReplace(find, replace);
    setFind("");
    setReplace("");
  }

  return (
    <div className={styles.bar}>
      <span className={styles.count}>{count} selected</span>
      <div className={styles.findReplace}>
        <Input
          className={styles.smallInput}
          placeholder="Find"
          value={find}
          onChange={(event) => {
            setFind(event.target.value);
          }}
        />
        <Input
          className={styles.smallInput}
          placeholder="Replace with"
          value={replace}
          onChange={(event) => {
            setReplace(event.target.value);
          }}
        />
        <Button size="sm" variant="secondary" disabled={!find} onClick={handleReplace}>
          Replace
        </Button>
      </div>
      <Button size="sm" variant="danger" onClick={onDelete}>
        Delete
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
