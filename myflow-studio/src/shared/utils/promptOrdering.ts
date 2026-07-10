import type { Prompt } from "@shared/types/prompt";

export type PromptSortMode = "manual" | "newest" | "oldest" | "az" | "za";

export function nextOrderValue(prompts: readonly Prompt[]): number {
  return prompts.reduce((max, prompt) => Math.max(max, prompt.order), -1) + 1;
}

export function sortPrompts(prompts: readonly Prompt[], mode: PromptSortMode): Prompt[] {
  const copy = [...prompts];
  switch (mode) {
    case "manual":
      return copy.sort((a, b) => a.order - b.order);
    case "newest":
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case "oldest":
      return copy.sort((a, b) => a.createdAt - b.createdAt);
    case "az":
      return copy.sort((a, b) => a.text.localeCompare(b.text));
    case "za":
      return copy.sort((a, b) => b.text.localeCompare(a.text));
  }
}

export function filterPromptsByQuery(prompts: readonly Prompt[], query: string): Prompt[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...prompts];
  }
  return prompts.filter((prompt) => prompt.text.toLowerCase().includes(normalized));
}
