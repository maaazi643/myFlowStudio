import { describe, expect, it } from "vitest";
import { matchesKeywords, normalizeForMatch } from "@shared/automation/textMatch";

describe("normalizeForMatch", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalizeForMatch("  Generate!  Image  ")).toBe("generate image");
    expect(normalizeForMatch("Aspect-Ratio:")).toBe("aspect ratio");
  });

  it("returns an empty string for input with no matchable characters", () => {
    expect(normalizeForMatch("   !!! ")).toBe("");
  });
});

describe("matchesKeywords", () => {
  it("matches when a keyword appears as a substring after normalization", () => {
    expect(matchesKeywords("Generate Image", ["generate"])).toBe(true);
    expect(matchesKeywords("Aspect Ratio: 16:9", ["aspect ratio"])).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesKeywords("Cancel", ["generate", "create"])).toBe(false);
  });

  it("returns false for empty text even with keywords present", () => {
    expect(matchesKeywords("", ["generate"])).toBe(false);
  });

  it("does not match a keyword that is only a substring of a different word", () => {
    // Regression: "generate" must not match inside "generated" — this caused
    // a download button's aria-label ("Download the generated image") to be
    // mistaken for the Generate button once the real one was removed.
    expect(matchesKeywords("Download the generated image", ["generate"])).toBe(false);
    expect(matchesKeywords("Regenerate", ["generate"])).toBe(false);
  });

  it("still matches a keyword as a whole word among other words", () => {
    expect(matchesKeywords("Click to generate now", ["generate"])).toBe(true);
  });
});
