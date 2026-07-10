import type { ParsedPrompt } from "./types";

function extractVariables(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const entries = Object.entries(raw as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function parseItem(item: unknown): ParsedPrompt | null {
  if (typeof item === "string") {
    const text = item.trim();
    return text ? { text } : null;
  }

  if (item && typeof item === "object" && "text" in item) {
    const rawText = item.text;
    if (typeof rawText !== "string") {
      return null;
    }
    const text = rawText.trim();
    if (!text) {
      return null;
    }
    return { text, variables: extractVariables((item as { variables?: unknown }).variables) };
  }

  return null;
}

/** Accepts a JSON array of strings, or objects shaped `{ text, variables? }`. */
export function parsePromptsFromJson(content: string): ParsedPrompt[] {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  if (!Array.isArray(data)) {
    throw new Error("Expected a JSON array of prompts.");
  }

  return data
    .map((item) => parseItem(item))
    .filter((prompt): prompt is ParsedPrompt => prompt !== null);
}
