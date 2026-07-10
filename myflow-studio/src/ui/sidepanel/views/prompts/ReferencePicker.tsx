import { useState } from "react";
import { useReferenceLibrary } from "@ui/hooks/useReferenceLibrary";
import { ReferenceThumbnail } from "./ReferenceThumbnail";
import styles from "./ReferencePicker.module.css";

export interface ReferencePickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/** Inline (non-modal) reference picker embedded in the prompt editor — pick from the library, or upload a new one on the spot. */
export function ReferencePicker({ selectedIds, onChange }: ReferencePickerProps) {
  const { images, loading, upload } = useReferenceLibrary();
  const [error, setError] = useState<string | undefined>();

  function toggle(id: string): void {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((existing) => existing !== id)
        : [...selectedIds, id],
    );
  }

  async function handleUpload(file: File): Promise<void> {
    setError(undefined);
    try {
      const image = await upload(file);
      onChange([...selectedIds, image.id]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that file.");
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>Reference images</span>
        <label className={styles.uploadLabel}>
          + Upload new
          <input
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleUpload(file);
              }
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? null : images.length === 0 ? (
        <p className={styles.empty}>No reference images uploaded yet.</p>
      ) : (
        <div className={styles.grid}>
          {images.map((image) => (
            <ReferenceThumbnail
              key={image.id}
              image={image}
              selectable
              selected={selectedIds.includes(image.id)}
              onToggle={() => {
                toggle(image.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
