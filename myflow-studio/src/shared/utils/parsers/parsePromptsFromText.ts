import type { ParsedPrompt } from "./types";

/** One prompt per non-empty line. */
export function parsePromptsFromText(content: string): ParsedPrompt[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text) => ({ text }));
}
