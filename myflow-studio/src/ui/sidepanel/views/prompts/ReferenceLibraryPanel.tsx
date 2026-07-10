import { useState } from "react";
import { Modal } from "@ui/components";
import { useReferenceLibrary } from "@ui/hooks/useReferenceLibrary";
import { ReferenceThumbnail } from "./ReferenceThumbnail";
import styles from "./ReferenceLibraryPanel.module.css";

export interface ReferenceLibraryPanelProps {
  open: boolean;
  onClose: () => void;
}

/** Manage the reference-image library: upload, view, delete. Every uploaded image is a reusable preset. */
export function ReferenceLibraryPanel({ open, onClose }: ReferenceLibraryPanelProps) {
  const { images, loading, upload, remove } = useReferenceLibrary();
  const [error, setError] = useState<string | undefined>();

  async function handleUpload(file: File): Promise<void> {
    setError(undefined);
    try {
      await upload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that file.");
    }
  }

  return (
    <Modal open={open} title="Reference images" onClose={onClose}>
      <div className={styles.body}>
        <div className={styles.uploadRow}>
          <span className={styles.count}>
            {images.length} image{images.length === 1 ? "" : "s"}
          </span>
          <label className={styles.fileLabel}>
            Upload
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
          <p className={styles.empty}>
            No reference images yet. Upload one to start building your library.
          </p>
        ) : (
          <div className={styles.grid}>
            {images.map((image) => (
              <ReferenceThumbnail
                key={image.id}
                image={image}
                onDelete={() => {
                  void remove(image.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
