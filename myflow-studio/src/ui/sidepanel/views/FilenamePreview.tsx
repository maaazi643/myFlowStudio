import { buildFilename } from "@shared/utils/filenameBuilder";
import type { FilenameTemplateId } from "@shared/types/generationSettings";
import styles from "./FilenamePreview.module.css";

export interface FilenamePreviewProps {
  startNumber: number;
  padding: number;
  template: FilenameTemplateId;
}

const EXAMPLE_PROMPTS = [
  "A neon jellyfish over Tokyo at night",
  "Portrait of a cyberpunk fox",
  "Misty mountain temple at dawn",
];

export function FilenamePreview({ startNumber, padding, template }: FilenamePreviewProps) {
  const safePadding = Number.isFinite(padding) ? Math.min(Math.max(padding, 1), 8) : 4;
  const safeStart = Number.isFinite(startNumber) ? startNumber : 0;

  const filenames = EXAMPLE_PROMPTS.map((promptText, index) =>
    buildFilename({ index, startNumber: safeStart, padding: safePadding, template, promptText }),
  );

  return (
    <div className={styles.preview}>
      {filenames.map((name) => (
        <code key={name} className={styles.line}>
          {name}
        </code>
      ))}
    </div>
  );
}
