import type { Prompt } from "@shared/types/prompt";

export interface PromptStats {
  count: number;
  totalCharacters: number;
  averageLength: number;
  imagesPerPrompt: number;
  totalImages: number;
  emptyCount: number;
}

export function computePromptStats(
  prompts: readonly Prompt[],
  imagesPerPrompt: number,
): PromptStats {
  const count = prompts.length;
  const totalCharacters = prompts.reduce((sum, prompt) => sum + prompt.text.length, 0);
  const emptyCount = prompts.filter((prompt) => prompt.text.trim().length === 0).length;

  return {
    count,
    totalCharacters,
    averageLength: count > 0 ? Math.round(totalCharacters / count) : 0,
    imagesPerPrompt,
    totalImages: count * imagesPerPrompt,
    emptyCount,
  };
}
