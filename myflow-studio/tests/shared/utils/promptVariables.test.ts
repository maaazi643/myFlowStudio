import { describe, expect, it } from "vitest";
import { extractVariableNames, resolvePromptText } from "@shared/utils/promptVariables";

describe("extractVariableNames", () => {
  it("finds a single token", () => {
    expect(extractVariableNames("a {{style}} jellyfish")).toEqual(["style"]);
  });

  it("finds multiple distinct tokens in appearance order", () => {
    expect(extractVariableNames("{{subject}} in the style of {{style}}")).toEqual([
      "subject",
      "style",
    ]);
  });

  it("dedupes repeated tokens", () => {
    expect(extractVariableNames("{{style}} then more {{style}}")).toEqual(["style"]);
  });

  it("tolerates internal whitespace inside the braces", () => {
    expect(extractVariableNames("{{  style  }}")).toEqual(["style"]);
  });

  it("returns an empty array when there are no tokens", () => {
    expect(extractVariableNames("a plain prompt")).toEqual([]);
  });

  it("ignores malformed single-brace text", () => {
    expect(extractVariableNames("a {style} jellyfish")).toEqual([]);
  });
});

describe("resolvePromptText", () => {
  it("substitutes a known variable", () => {
    expect(resolvePromptText("a {{style}} jellyfish", { style: "watercolor" })).toBe(
      "a watercolor jellyfish",
    );
  });

  it("leaves an unresolved token as-is when its value is missing", () => {
    expect(resolvePromptText("a {{style}} jellyfish", {})).toBe("a {{style}} jellyfish");
  });

  it("leaves the token as-is when its value is an empty string", () => {
    expect(resolvePromptText("a {{style}} jellyfish", { style: "" })).toBe("a {{style}} jellyfish");
  });

  it("returns the text unchanged when no variables are given", () => {
    expect(resolvePromptText("a {{style}} jellyfish", undefined)).toBe("a {{style}} jellyfish");
  });

  it("substitutes multiple distinct tokens", () => {
    expect(
      resolvePromptText("{{subject}} in the style of {{style}}", {
        subject: "a fox",
        style: "ukiyo-e",
      }),
    ).toBe("a fox in the style of ukiyo-e");
  });
});
