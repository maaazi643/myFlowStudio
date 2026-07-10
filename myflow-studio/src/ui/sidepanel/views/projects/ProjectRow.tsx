import { useState } from "react";
import { Badge, Button, Input } from "@ui/components";
import type { Project } from "@shared/types/project";
import styles from "./ProjectRow.module.css";

export interface ProjectRowProps {
  project: Project;
  active: boolean;
  onOpen: () => void;
  onSave: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function ProjectRow({
  project,
  active,
  onOpen,
  onSave,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
}: ProjectRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(project.name);

  function commitRename(): void {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== project.name) {
      onRename(trimmed);
    }
    setRenaming(false);
  }

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        {renaming ? (
          <Input
            aria-label={`Rename ${project.name}`}
            autoFocus
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value);
            }}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitRename();
              } else if (event.key === "Escape") {
                setDraftName(project.name);
                setRenaming(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className={styles.name}
            onClick={() => {
              setDraftName(project.name);
              setRenaming(true);
            }}
            aria-label={`Rename ${project.name}`}
          >
            {project.name}
          </button>
        )}
        <p className={styles.meta}>
          {active ? <Badge tone="accent">Active</Badge> : null} Updated{" "}
          {new Date(project.updatedAt).toLocaleString()}
        </p>
      </div>
      <div className={styles.actions}>
        <div className={styles.actionsRow}>
          {active ? (
            <Button variant="secondary" size="sm" onClick={onSave}>
              Save
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onOpen}>
              Open
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDuplicate} aria-label="Duplicate project">
            ⧉
          </Button>
        </div>
        <div className={styles.actionsRow}>
          <Button variant="ghost" size="sm" onClick={onExport} aria-label="Export project">
            ⭳
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete project">
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}
