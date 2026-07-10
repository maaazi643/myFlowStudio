import { describe, expect, it } from "vitest";
import { buildQueueItems } from "@shared/utils/queueBuilder";
import type { Prompt } from "@shared/types/prompt";

function makePrompt(overrides: Partial<Prompt>): Prompt {
  return {
    id: crypto.randomUUID(),
    projectId: null,
    text: "a prompt",
    order: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("buildQueueItems", () => {
  it("creates one item per prompt when imagesPerPrompt is 1", () => {
    const prompts = [makePrompt({ text: "a fox" }), makePrompt({ text: "a jellyfish" })];
    const items = buildQueueItems(prompts, 1);
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.promptText)).toEqual(["a fox", "a jellyfish"]);
  });

  it("expands each prompt into imagesPerPrompt items", () => {
    const prompts = [makePrompt({ text: "a fox" })];
    const items = buildQueueItems(prompts, 3);
    expect(items).toHaveLength(3);
    expect(items.every((item) => item.promptId === prompts[0]?.id)).toBe(true);
    expect(items.map((item) => item.imageIndexForPrompt)).toEqual([0, 1, 2]);
  });

  it("assigns a contiguous globalIndex across all prompts", () => {
    const prompts = [makePrompt({ text: "a fox" }), makePrompt({ text: "a jellyfish" })];
    const items = buildQueueItems(prompts, 2);
    expect(items.map((item) => item.globalIndex)).toEqual([0, 1, 2, 3]);
  });

  it("starts every item as pending with zero attempts", () => {
    const items = buildQueueItems([makePrompt({})], 1);
    expect(items[0]?.status).toBe("pending");
    expect(items[0]?.attempts).toBe(0);
  });

  it("resolves {{variables}} at build time", () => {
    const prompts = [makePrompt({ text: "a {{subject}}", variables: { subject: "fox" } })];
    const items = buildQueueItems(prompts, 1);
    expect(items[0]?.promptText).toBe("a fox");
  });

  it("returns an empty array for an empty prompt list", () => {
    expect(buildQueueItems([], 4)).toEqual([]);
  });

  it("returns an empty array when imagesPerPrompt is 0", () => {
    expect(buildQueueItems([makePrompt({})], 0)).toEqual([]);
  });
});
