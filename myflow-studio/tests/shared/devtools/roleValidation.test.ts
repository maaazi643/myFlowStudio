import { describe, expect, it } from "vitest";
import { validateElementForRole } from "@shared/devtools/roleValidation";
import type { ElementSnapshot } from "@shared/devtools/elementSnapshot";

function makeSnapshot(overrides: Partial<ElementSnapshot> = {}): ElementSnapshot {
  return {
    tagName: "div",
    classNames: [],
    attributes: {},
    nthChild: 1,
    ...overrides,
  };
}

describe("validateElementForRole", () => {
  it("accepts a textarea for promptBox without warning", () => {
    const result = validateElementForRole("promptBox", makeSnapshot({ tagName: "textarea" }));
    expect(result).toEqual({ valid: true });
  });

  it("accepts a contenteditable div for promptBox", () => {
    const result = validateElementForRole(
      "promptBox",
      makeSnapshot({ tagName: "div", attributes: { contenteditable: "true" } }),
    );
    expect(result.warning).toBeUndefined();
  });

  it("warns when promptBox looks like a button", () => {
    const result = validateElementForRole("promptBox", makeSnapshot({ tagName: "button" }));
    expect(result.valid).toBe(true);
    expect(result.warning).toMatch(/text input, textarea, or editable field/);
  });

  it("accepts a button for generateButton", () => {
    const result = validateElementForRole("generateButton", makeSnapshot({ tagName: "button" }));
    expect(result.warning).toBeUndefined();
  });

  it("accepts role=button for generateButton", () => {
    const result = validateElementForRole(
      "generateButton",
      makeSnapshot({ tagName: "div", attributes: { role: "button" } }),
    );
    expect(result.warning).toBeUndefined();
  });

  it("warns when generateButton looks like a textarea", () => {
    const result = validateElementForRole("generateButton", makeSnapshot({ tagName: "textarea" }));
    expect(result.warning).toMatch(/a button/);
  });

  it("accepts an input[type=file] for referenceUpload", () => {
    const result = validateElementForRole(
      "referenceUpload",
      makeSnapshot({ tagName: "input", attributes: { type: "file" } }),
    );
    expect(result.warning).toBeUndefined();
  });

  it("accepts a button trigger for referenceUpload", () => {
    const result = validateElementForRole("referenceUpload", makeSnapshot({ tagName: "button" }));
    expect(result.warning).toBeUndefined();
  });

  it("accepts a select for modelSelector", () => {
    const result = validateElementForRole("modelSelector", makeSnapshot({ tagName: "select" }));
    expect(result.warning).toBeUndefined();
  });

  it("accepts role=combobox for aspectRatioSelector", () => {
    const result = validateElementForRole(
      "aspectRatioSelector",
      makeSnapshot({ tagName: "div", attributes: { role: "combobox" } }),
    );
    expect(result.warning).toBeUndefined();
  });

  it("warns when qualitySelector looks like a plain text field", () => {
    const result = validateElementForRole(
      "qualitySelector",
      makeSnapshot({ tagName: "input", attributes: { type: "text" } }),
    );
    expect(result.warning).toMatch(/dropdown or select control/);
  });

  it("never rejects — valid is always true even with a warning", () => {
    const result = validateElementForRole("promptBox", makeSnapshot({ tagName: "select" }));
    expect(result.valid).toBe(true);
  });
});
