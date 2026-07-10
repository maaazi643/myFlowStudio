import type { GenerationSettings } from "@shared/types/generationSettings";

export interface AutomationRequest {
  promptText: string;
  settings: GenerationSettings;
}

export interface AutomationResult {
  ok: boolean;
  /** Present when ok is false. */
  error?: string | undefined;
  /**
   * The generated image, once there's a real automation engine to produce
   * one (M6/M8). Absent from the simulated executor.
   */
  imageBlob?: Blob | undefined;
}

/**
 * The seam between the queue engine (M7) and the real automation engine
 * (M6, blocked on DOM access to the live product). The queue only ever
 * talks to this interface — swapping SimulatedAutomationExecutor for a
 * real content-script bridge later touches nothing in background/queue/.
 */
export interface AutomationExecutor {
  generate(request: AutomationRequest): Promise<AutomationResult>;
}
