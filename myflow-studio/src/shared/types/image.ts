export type ImageKind = "reference" | "generated";

/**
 * Covers both uploaded reference images (M9) and downloaded generation
 * output (M8) — same storage shape, distinguished by `kind`.
 */
export interface StoredImage {
  id: string;
  kind: ImageKind;
  projectId: string | null;
  promptId: string | null;
  fileName: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
}
