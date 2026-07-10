export interface Prompt {
  id: string;
  projectId: string | null;
  text: string;
  /** Values for any {{variable}} tokens in text — see shared/utils/promptVariables. */
  variables?: Record<string, string> | undefined;
  /**
   * StoredImage ids (kind "reference") to use for this prompt. The images
   * themselves live once in the imagesRepository library — this is a
   * many-to-many link, not a copy, so one uploaded reference can be reused
   * across any number of prompts.
   */
  referenceImageIds?: string[] | undefined;
  /**
   * Manual sort position. IndexedDB's getAll() returns records in primary
   * key order — and our keys are random UUIDs, not insertion order — so
   * this is the only reliable way to offer a stable "manual" ordering.
   */
  order: number;
  createdAt: number;
  updatedAt: number;
}
