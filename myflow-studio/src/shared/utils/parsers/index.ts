import { parsePromptsFromText } from "./parsePromptsFromText";
import { parsePromptsFromCsv } from "./parsePromptsFromCsv";
import { parsePromptsFromJson } from "./parsePromptsFromJson";
import type { ParsedPrompt } from "./types";

export type { ParsedPrompt } from "./types";
export { parsePromptsFromText } from "./parsePromptsFromText";
export { parsePromptsFromCsv } from "./parsePromptsFromCsv";
export { parsePromptsFromJson } from "./parsePromptsFromJson";

export function parsePromptsFromFile(filename: string, content: string): ParsedPrompt[] {
  const extension = filename.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "txt":
      return parsePromptsFromText(content);
    case "csv":
      return parsePromptsFromCsv(content);
    case "json":
      return parsePromptsFromJson(content);
    default:
      throw new Error(
        `Unsupported file type: .${extension ?? "unknown"}. Use .txt, .csv, or .json.`,
      );
  }
}
