import { describe, expect, it } from "vitest";
import { computePromptStats } from "@shared/utils/promptStats";
import type { Prompt } from "@shared/types/prompt";

function makePrompt(text: string): Prompt {
  return {
    id: crypto.randomUUID(),
    projectId: null,
    text,
    order: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("computePromptStats", () => {
  it("returns zeroed stats for an empty list", () => {
    expect(computePromptStats([], 2)).toEqual({
      count: 0,
      totalCharacters: 0,
      averageLength: 0,
      imagesPerPrompt: 2,
      totalImages: 0,
      emptyCount: 0,
    });
  });

  it("computes count, character totals, and average length", () => {
    const prompts = [makePrompt("abc"), makePrompt("abcdefg")];
    const stats = computePromptStats(prompts, 1);
    expect(stats.count).toBe(2);
    expect(stats.totalCharacters).toBe(10);
    expect(stats.averageLength).toBe(5);
  });

  it("multiplies count by imagesPerPrompt for the total", () => {
    const prompts = [makePrompt("a"), makePrompt("b"), makePrompt("c")];
    expect(computePromptStats(prompts, 3).totalImages).toBe(9);
  });

  it("counts prompts that are empty or only whitespace", () => {
    const prompts = [makePrompt("real prompt"), makePrompt(""), makePrompt("   ")];
    expect(computePromptStats(prompts, 1).emptyCount).toBe(2);
  });
});
