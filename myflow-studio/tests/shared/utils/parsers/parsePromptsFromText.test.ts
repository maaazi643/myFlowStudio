import { describe, expect, it } from "vitest";
import { parsePromptsFromText } from "@shared/utils/parsers/parsePromptsFromText";

describe("parsePromptsFromText", () => {
  it("splits on newlines", () => {
    expect(parsePromptsFromText("a fox\na jellyfish\na temple")).toEqual([
      { text: "a fox" },
      { text: "a jellyfish" },
      { text: "a temple" },
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parsePromptsFromText("a fox\r\na jellyfish")).toEqual([
      { text: "a fox" },
      { text: "a jellyfish" },
    ]);
  });

  it("trims each line and drops blank lines", () => {
    expect(parsePromptsFromText("  a fox  \n\n  \na jellyfish")).toEqual([
      { text: "a fox" },
      { text: "a jellyfish" },
    ]);
  });

  it("returns an empty array for empty content", () => {
    expect(parsePromptsFromText("")).toEqual([]);
  });
});
