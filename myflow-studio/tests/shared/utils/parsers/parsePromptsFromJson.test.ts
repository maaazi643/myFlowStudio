import { describe, expect, it } from "vitest";
import { parsePromptsFromJson } from "@shared/utils/parsers/parsePromptsFromJson";

describe("parsePromptsFromJson", () => {
  it("accepts an array of plain strings", () => {
    expect(parsePromptsFromJson('["a fox", "a jellyfish"]')).toEqual([
      { text: "a fox" },
      { text: "a jellyfish" },
    ]);
  });

  it("accepts an array of objects with text and variables", () => {
    const json = JSON.stringify([{ text: "a fox", variables: { style: "ukiyo-e" } }]);
    expect(parsePromptsFromJson(json)).toEqual([
      { text: "a fox", variables: { style: "ukiyo-e" } },
    ]);
  });

  it("accepts a mix of strings and objects", () => {
    const json = JSON.stringify(["a fox", { text: "a jellyfish" }]);
    expect(parsePromptsFromJson(json)).toEqual([{ text: "a fox" }, { text: "a jellyfish" }]);
  });

  it("drops entries with blank text", () => {
    const json = JSON.stringify(["", "   ", "a fox"]);
    expect(parsePromptsFromJson(json)).toEqual([{ text: "a fox" }]);
  });

  it("drops non-string variable values", () => {
    const json = JSON.stringify([{ text: "a fox", variables: { style: "ukiyo-e", count: 3 } }]);
    expect(parsePromptsFromJson(json)).toEqual([
      { text: "a fox", variables: { style: "ukiyo-e" } },
    ]);
  });

  it("ignores malformed items instead of throwing", () => {
    const json = JSON.stringify([42, null, { nope: true }, "a fox"]);
    expect(parsePromptsFromJson(json)).toEqual([{ text: "a fox" }]);
  });

  it("throws a clear error for invalid JSON", () => {
    expect(() => parsePromptsFromJson("{not json")).toThrow(/valid JSON/);
  });

  it("throws a clear error when the top level isn't an array", () => {
    expect(() => parsePromptsFromJson('{"text": "a fox"}')).toThrow(/array/);
  });
});
