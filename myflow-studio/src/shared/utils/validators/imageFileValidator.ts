const MAX_REFERENCE_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_MIME_PREFIX = "image/";

export interface ImageFileValidation {
  valid: boolean;
  error?: string;
}

/** Takes a plain {type, size} shape rather than File so this stays testable without a DOM. */
export function validateImageFile(file: { type: string; size: number }): ImageFileValidation {
  if (!file.type.startsWith(ACCEPTED_MIME_PREFIX)) {
    return { valid: false, error: "That file isn't an image." };
  }
  if (file.size === 0) {
    return { valid: false, error: "That file is empty." };
  }
  if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
    return { valid: false, error: "Images must be 8 MB or smaller." };
  }
  return { valid: true };
}
