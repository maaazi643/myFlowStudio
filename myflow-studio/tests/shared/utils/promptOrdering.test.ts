import { describe, expect, it } from "vitest";
import { filterPromptsByQuery, nextOrderValue, sortPrompts } from "@shared/utils/promptOrdering";
import type { Prompt } from "@shared/types/prompt";

function makePrompt(overrides: Partial<Prompt>): Prompt {
  return {
    id: crypto.randomUUID(),
    projectId: null,
    text: "a prompt",
    order: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("nextOrderValue", () => {
  it("returns 0 for an empty list", () => {
    expect(nextOrderValue([])).toBe(0);
  });

  it("returns one past the highest existing order", () => {
    const prompts = [makePrompt({ order: 0 }), makePrompt({ order: 5 }), makePrompt({ order: 2 })];
    expect(nextOrderValue(prompts)).toBe(6);
  });
});

describe("sortPrompts", () => {
  const a = makePrompt({ text: "banana", order: 2, createdAt: 100 });
  const b = makePrompt({ text: "apple", order: 0, createdAt: 300 });
  const c = makePrompt({ text: "cherry", order: 1, createdAt: 200 });
  const prompts = [a, b, c];

  it("manual mode sorts by order ascending", () => {
    expect(sortPrompts(prompts, "manual").map((p) => p.text)).toEqual([
      "apple",
      "cherry",
      "banana",
    ]);
  });

  it("newest mode sorts by createdAt descending", () => {
    expect(sortPrompts(prompts, "newest").map((p) => p.text)).toEqual([
      "apple",
      "cherry",
      "banana",
    ]);
  });

  it("oldest mode sorts by createdAt ascending", () => {
    expect(sortPrompts(prompts, "oldest").map((p) => p.text)).toEqual([
      "banana",
      "cherry",
      "apple",
    ]);
  });

  it("az mode sorts alphabetically", () => {
    expect(sortPrompts(prompts, "az").map((p) => p.text)).toEqual(["apple", "banana", "cherry"]);
  });

  it("za mode sorts reverse alphabetically", () => {
    expect(sortPrompts(prompts, "za").map((p) => p.text)).toEqual(["cherry", "banana", "apple"]);
  });

  it("does not mutate the input array", () => {
    const original = [...prompts];
    sortPrompts(prompts, "az");
    expect(prompts).toEqual(original);
  });
});

describe("filterPromptsByQuery", () => {
  const prompts = [
    makePrompt({ text: "A neon jellyfish over Tokyo" }),
    makePrompt({ text: "A cyberpunk fox portrait" }),
  ];

  it("returns everything for an empty query", () => {
    expect(filterPromptsByQuery(prompts, "")).toHaveLength(2);
  });

  it("returns everything for a whitespace-only query", () => {
    expect(filterPromptsByQuery(prompts, "   ")).toHaveLength(2);
  });

  it("filters case-insensitively by substring", () => {
    expect(filterPromptsByQuery(prompts, "TOKYO")).toEqual([prompts[0]]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterPromptsByQuery(prompts, "spaceship")).toEqual([]);
  });
});
