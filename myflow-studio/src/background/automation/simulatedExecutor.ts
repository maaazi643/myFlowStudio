import type {
  AutomationExecutor,
  AutomationRequest,
  AutomationResult,
} from "@shared/automation/executor";
import { getSpeedProfile } from "@shared/config/speedProfiles";

/**
 * Stands in for the real automation engine until the feasibility spike
 * unblocks M6. Delays realistically (using the same speed-profile bands
 * the real engine will use) and fails at a configurable rate so the queue
 * engine's retry path gets genuinely exercised — this is not a demo
 * stub, it's what M7 is built and tested against.
 */
export interface SimulatedAutomationExecutorOptions {
  /** 0-1 probability a generation "fails". Default 0.15. */
  failureRate?: number;
  random?: () => number;
  delay?: (ms: number) => Promise<void>;
  renderImage?: (promptText: string) => Promise<Blob>;
}

const DEFAULT_FAILURE_RATE = 0.15;
const FALLBACK_DELAY_RANGE_MS = { min: 500, max: 1500 };
const PLACEHOLDER_IMAGE_SIZE = 64;

function defaultDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** A small solid-color PNG, colored from a hash of the prompt text, so different prompts visibly differ. */
async function renderPlaceholderImage(promptText: string): Promise<Blob> {
  let hash = 0;
  for (let i = 0; i < promptText.length; i += 1) {
    hash = (hash * 31 + promptText.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;

  const canvas = new OffscreenCanvas(PLACEHOLDER_IMAGE_SIZE, PLACEHOLDER_IMAGE_SIZE);
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = `hsl(${String(hue)}, 60%, 55%)`;
    context.fillRect(0, 0, PLACEHOLDER_IMAGE_SIZE, PLACEHOLDER_IMAGE_SIZE);
  }
  return canvas.convertToBlob({ type: "image/png" });
}

export function createSimulatedAutomationExecutor(
  options: SimulatedAutomationExecutorOptions = {},
): AutomationExecutor {
  const failureRate = options.failureRate ?? DEFAULT_FAILURE_RATE;
  const random = options.random ?? Math.random;
  const delay = options.delay ?? defaultDelay;
  const renderImage = options.renderImage ?? renderPlaceholderImage;

  return {
    async generate(request: AutomationRequest): Promise<AutomationResult> {
      const profile = getSpeedProfile(request.settings.speedProfileId);
      const { min, max } = profile?.delayBetweenPromptsMs ?? FALLBACK_DELAY_RANGE_MS;
      const waitMs = min + random() * (max - min);
      await delay(waitMs);

      if (random() < failureRate) {
        return {
          ok: false,
          error:
            "Simulated generation failure (placeholder executor — no real automation engine yet).",
        };
      }

      const imageBlob = await renderImage(request.promptText);
      return { ok: true, imageBlob };
    },
  };
}
