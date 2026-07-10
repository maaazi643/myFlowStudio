import { describe, expect, it, vi } from "vitest";
import { createSimulatedAutomationExecutor } from "@background/automation/simulatedExecutor";
import type { GenerationSettings } from "@shared/types/generationSettings";

const SETTINGS: GenerationSettings = {
  speedProfileId: "fast",
  imagesPerPrompt: 1,
  aspectRatioId: "16:9",
  modelId: "flow-standard",
  qualityId: "standard",
  autoDownload: true,
  startNumber: 1,
  numberPadding: 4,
  filenameTemplate: "numbered",
};

function noDelay(): Promise<void> {
  return Promise.resolve();
}

describe("createSimulatedAutomationExecutor", () => {
  it("succeeds when the random roll is above the failure rate", async () => {
    const fakeBlob = new Blob(["fake"], { type: "image/png" });
    const executor = createSimulatedAutomationExecutor({
      failureRate: 0.2,
      random: () => 0.9,
      delay: noDelay,
      renderImage: () => Promise.resolve(fakeBlob),
    });

    const result = await executor.generate({ promptText: "a fox", settings: SETTINGS });

    expect(result.ok).toBe(true);
    expect(result.imageBlob).toBe(fakeBlob);
    expect(result.error).toBeUndefined();
  });

  it("fails when the random roll is below the failure rate", async () => {
    const executor = createSimulatedAutomationExecutor({
      failureRate: 0.5,
      random: () => 0.1,
      delay: noDelay,
    });

    const result = await executor.generate({ promptText: "a fox", settings: SETTINGS });

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.imageBlob).toBeUndefined();
  });

  it("waits within the active speed profile's delay band", async () => {
    const delaySpy = vi.fn((_ms: number) => Promise.resolve());
    const executor = createSimulatedAutomationExecutor({
      random: () => 0.5, // used for both the delay jitter and the failure roll
      failureRate: 0,
      delay: delaySpy,
      renderImage: () => Promise.resolve(new Blob()),
    });

    await executor.generate({ promptText: "a fox", settings: SETTINGS });

    expect(delaySpy).toHaveBeenCalledTimes(1);
    const waitedMs = delaySpy.mock.calls[0]?.[0] as number;
    // "fast" profile: 1500-3000ms band.
    expect(waitedMs).toBeGreaterThanOrEqual(1500);
    expect(waitedMs).toBeLessThanOrEqual(3000);
  });

  it("falls back to a default delay band for an unknown speed profile", async () => {
    const delaySpy = vi.fn((_ms: number) => Promise.resolve());
    const executor = createSimulatedAutomationExecutor({
      random: () => 0,
      failureRate: 0,
      delay: delaySpy,
      renderImage: () => Promise.resolve(new Blob()),
    });

    await executor.generate({
      promptText: "a fox",
      settings: { ...SETTINGS, speedProfileId: "not-a-real-profile" },
    });

    const waitedMs = delaySpy.mock.calls[0]?.[0] as number;
    expect(waitedMs).toBe(500);
  });
});
