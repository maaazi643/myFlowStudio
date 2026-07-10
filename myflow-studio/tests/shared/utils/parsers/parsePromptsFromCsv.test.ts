import { describe, expect, it } from "vitest";
import { parsePromptsFromCsv } from "@shared/utils/parsers/parsePromptsFromCsv";

describe("parsePromptsFromCsv", () => {
  it("treats every row as a prompt when there's no recognized header", () => {
    const csv = "a fox\na jellyfish";
    expect(parsePromptsFromCsv(csv)).toEqual([{ text: "a fox" }, { text: "a jellyfish" }]);
  });

  it("skips a 'prompt' header row and reads variable columns by name", () => {
    const csv = "prompt,style,mood\na fox,ukiyo-e,calm\na jellyfish,watercolor,";
    expect(parsePromptsFromCsv(csv)).toEqual([
      { text: "a fox", variables: { style: "ukiyo-e", mood: "calm" } },
      { text: "a jellyfish", variables: { style: "watercolor" } },
    ]);
  });

  it("recognizes a 'text' header too, case-insensitively", () => {
    const csv = "TEXT,style\na fox,ukiyo-e";
    expect(parsePromptsFromCsv(csv)).toEqual([{ text: "a fox", variables: { style: "ukiyo-e" } }]);
  });

  it("handles quoted fields containing commas", () => {
    const csv = 'prompt,style\n"a fox, sitting calmly",ukiyo-e';
    expect(parsePromptsFromCsv(csv)).toEqual([
      { text: "a fox, sitting calmly", variables: { style: "ukiyo-e" } },
    ]);
  });

  it("handles escaped double quotes inside a quoted field", () => {
    const csv = 'prompt\n"a fox saying ""hello"""';
    expect(parsePromptsFromCsv(csv)).toEqual([{ text: 'a fox saying "hello"' }]);
  });

  it("drops rows with an empty prompt column", () => {
    const csv = "prompt,style\n,ukiyo-e\na fox,ukiyo-e";
    expect(parsePromptsFromCsv(csv)).toEqual([{ text: "a fox", variables: { style: "ukiyo-e" } }]);
  });

  it("returns an empty array for empty content", () => {
    expect(parsePromptsFromCsv("")).toEqual([]);
  });

  it("omits the variables key entirely when a header row has no other columns", () => {
    const csv = "prompt\na fox\na jellyfish";
    expect(parsePromptsFromCsv(csv)).toEqual([{ text: "a fox" }, { text: "a jellyfish" }]);
  });
});
