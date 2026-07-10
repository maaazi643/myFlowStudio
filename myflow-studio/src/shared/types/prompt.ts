/**
 * Deliberately minimal for now — variables, tags, and other prompt-editor
 * fields arrive with M5 (prompt management), extending this rather than
 * replacing it.
 */
export interface Prompt {
  id: string;
  projectId: string | null;
  text: string;
  createdAt: number;
  updatedAt: number;
}
