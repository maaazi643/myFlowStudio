import { useState } from "react";
import type { DragEvent } from "react";
import { Button, Modal } from "@ui/components";
import { cssClass } from "@ui/utils/cssModule";
import { parsePromptsFromFile } from "@shared/utils/parsers";
import type { ParsedPrompt } from "@shared/utils/parsers";
import styles from "./ImportPanel.module.css";

export interface ImportPanelProps {
  open: boolean;
  onClose: () => void;
  onImport: (parsed: ParsedPrompt[]) => void;
}

const PREVIEW_LIMIT = 5;

export function ImportPanel({ open, onClose, onImport }: ImportPanelProps) {
  const [error, setError] = useState<string | undefined>();
  const [preview, setPreview] = useState<ParsedPrompt[] | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function reset(): void {
    setError(undefined);
    setPreview(null);
    setDragActive(false);
  }

  async function handleFile(file: File): Promise<void> {
    setError(undefined);
    try {
      const content = await file.text();
      const parsed = parsePromptsFromFile(file.name, content);
      if (parsed.length === 0) {
        setError("No prompts found in that file.");
        setPreview(null);
        return;
      }
      setPreview(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
      setPreview(null);
    }
  }

  function handleConfirm(): void {
    if (preview) {
      onImport(preview);
      reset();
      onClose();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  }

  return (
    <Modal
      open={open}
      title="Import prompts"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <div className={styles.body}>
        <div
          className={[styles.dropzone, dragActive ? cssClass(styles.dropzoneActive) : ""]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => {
            setDragActive(false);
          }}
          onDrop={handleDrop}
        >
          <p>Drag a .txt, .csv, or .json file here</p>
          <p className={styles.or}>or</p>
          <label className={styles.fileLabel}>
            Choose file
            <input
              type="file"
              accept=".txt,.csv,.json"
              className={styles.fileInput}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleFile(file);
                }
              }}
            />
          </label>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        {preview ? (
          <div className={styles.previewBox}>
            <p className={styles.previewCount}>
              {preview.length} prompt{preview.length === 1 ? "" : "s"} found
            </p>
            <ul className={styles.previewList}>
              {preview.slice(0, PREVIEW_LIMIT).map((item, index) => (
                <li key={`${String(index)}-${item.text}`}>{item.text}</li>
              ))}
            </ul>
            {preview.length > PREVIEW_LIMIT ? (
              <p className={styles.previewMore}>+{preview.length - PREVIEW_LIMIT} more</p>
            ) : null}
          </div>
        ) : null}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!preview}>
            {preview ? `Import ${String(preview.length)}` : "Import"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
