import type { GenerationSettings } from "@shared/types/generationSettings";

export interface AutomationRequest {
  promptText: string;
  referenceImageIds?: string[] | undefined;
  /** This item's position within the run — the real executor uses it to build a deterministic output filename (M8). */
  imageIndex: number;
  settings: GenerationSettings;
}

export interface AutomationResult {
  ok: boolean;
  /** Present when ok is false. */
  error?: string | undefined;
  /**
   * The generated image, when an executor produces one directly (the
   * simulated executor's placeholder). The real executor doesn't — it
   * gets the image out via Flow's own Download button (M6/M8), not by
   * fetching bytes itself.
   */
  imageBlob?: Blob | undefined;
}

/**
 * The seam between the queue engine (M7) and the automation engine (M6).
 * The queue only ever talks to this interface — swapping which executor
 * is behind it (simulated vs. real) touches nothing in background/queue/.
 */
export interface AutomationExecutor {
  generate(request: AutomationRequest): Promise<AutomationResult>;
}
