import { describe, expect, it } from "vitest";
import { parsePromptsFromFile } from "@shared/utils/parsers";

describe("parsePromptsFromFile", () => {
  it("dispatches .txt to the text parser", () => {
    expect(parsePromptsFromFile("prompts.txt", "a fox\na jellyfish")).toEqual([
      { text: "a fox" },
      { text: "a jellyfish" },
    ]);
  });

  it("dispatches .csv to the CSV parser", () => {
    expect(parsePromptsFromFile("prompts.csv", "a fox\na jellyfish")).toEqual([
      { text: "a fox" },
      { text: "a jellyfish" },
    ]);
  });

  it("dispatches .json to the JSON parser", () => {
    expect(parsePromptsFromFile("prompts.json", '["a fox"]')).toEqual([{ text: "a fox" }]);
  });

  it("is case-insensitive about the extension", () => {
    expect(parsePromptsFromFile("prompts.TXT", "a fox")).toEqual([{ text: "a fox" }]);
  });

  it("throws for an unsupported extension", () => {
    expect(() => parsePromptsFromFile("prompts.pdf", "")).toThrow(/Unsupported file type/);
  });

  it("throws for a file with no extension", () => {
    expect(() => parsePromptsFromFile("prompts", "")).toThrow(/Unsupported file type/);
  });
});
