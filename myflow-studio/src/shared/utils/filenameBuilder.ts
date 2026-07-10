import type { FilenameTemplateId } from "@shared/types/generationSettings";
import { slugify } from "./slugify";

export interface BuildFilenameInput {
  /** 0-based position of this image within the run. */
  index: number;
  startNumber: number;
  padding: number;
  template: FilenameTemplateId;
  promptText?: string;
  extension?: string;
}

/**
 * Pure — reused as-is by the queue's live preview (M4) and by the actual
 * download pipeline (M8), so naming behavior only needs to be correct
 * in one place.
 */
export function buildFilename(input: BuildFilenameInput): string {
  const { index, startNumber, padding, template, promptText, extension = "png" } = input;
  const number = String(startNumber + index).padStart(padding, "0");

  if (template === "numbered-prompt") {
    return `${number}_${slugify(promptText ?? "")}.${extension}`;
  }
  return `${number}.${extension}`;
}
