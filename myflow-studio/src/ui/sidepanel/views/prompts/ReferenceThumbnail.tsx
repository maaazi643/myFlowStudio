import { Button, Checkbox } from "@ui/components";
import { cssClass } from "@ui/utils/cssModule";
import { useObjectUrl } from "@ui/hooks/useObjectUrl";
import type { StoredImage } from "@shared/types/image";
import styles from "./ReferenceThumbnail.module.css";

export interface ReferenceThumbnailProps {
  image: StoredImage;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
}

export function ReferenceThumbnail({
  image,
  selectable = false,
  selected = false,
  onToggle,
  onDelete,
}: ReferenceThumbnailProps) {
  const url = useObjectUrl(image.blob);

  return (
    <div className={[styles.thumb, selected ? cssClass(styles.selected) : ""].join(" ")}>
      <div className={styles.imageWrap}>
        {url ? <img src={url} alt={image.fileName} className={styles.image} /> : null}
        {selectable && onToggle ? (
          <span className={styles.checkboxOverlay}>
            <Checkbox
              aria-label={`Select ${image.fileName} as a reference`}
              checked={selected}
              onChange={onToggle}
            />
          </span>
        ) : null}
        {!selectable && onDelete ? (
          <span className={styles.deleteOverlay}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              aria-label={`Delete ${image.fileName}`}
            >
              ✕
            </Button>
          </span>
        ) : null}
      </div>
      <p className={styles.name} title={image.fileName}>
        {image.fileName}
      </p>
    </div>
  );
}
