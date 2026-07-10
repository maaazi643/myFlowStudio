import type { GenerationSettings } from "./generationSettings";

/**
 * A project is a named save-slot for generation settings, layered on top of
 * the prompts that already belong to it (Prompt.projectId). Reference images
 * stay in the one shared library (see image.ts) rather than being duplicated
 * per project — only the generation settings and the set of prompts differ.
 */
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Snapshot captured on "Save" — undefined until the project is saved at least once. */
  settings?: GenerationSettings | undefined;
}
