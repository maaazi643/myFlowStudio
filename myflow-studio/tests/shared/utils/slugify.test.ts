import { describe, expect, it } from "vitest";
import { slugify } from "@shared/utils/slugify";

describe("slugify", () => {
  it("replaces non-alphanumeric runs with a single underscore", () => {
    expect(slugify("A neon jellyfish, over Tokyo!")).toBe("A_neon_jellyfish_over_Tokyo");
  });

  it("trims leading and trailing underscores", () => {
    expect(slugify("  --hello--  ")).toBe("hello");
  });

  it("falls back to 'untitled' for text with no keepable characters", () => {
    expect(slugify("!!!")).toBe("untitled");
  });

  it("falls back to 'untitled' for empty text", () => {
    expect(slugify("")).toBe("untitled");
  });

  it("truncates to the given max length", () => {
    expect(slugify("a".repeat(100), 10)).toBe("a".repeat(10));
  });
});
