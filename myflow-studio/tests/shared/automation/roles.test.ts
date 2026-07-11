import { describe, expect, it } from "vitest";
import {
  AUTOMATION_ROLE_DEFINITIONS,
  getRoleDefinition,
  requiredRoles,
} from "@shared/automation/roles";

describe("AUTOMATION_ROLE_DEFINITIONS", () => {
  it("defines exactly the 7 roles MyFlow Studio needs on Google Flow", () => {
    expect(AUTOMATION_ROLE_DEFINITIONS.map((d) => d.role).sort()).toEqual(
      [
        "promptEditor",
        "generateButton",
        "downloadButton",
        "referenceImageUpload",
        "modelSelector",
        "aspectRatioSelector",
        "imageQualitySelector",
      ].sort(),
    );
  });

  it("gives every role at least one keyword", () => {
    for (const definition of AUTOMATION_ROLE_DEFINITIONS) {
      expect(definition.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe("getRoleDefinition", () => {
  it("returns the matching definition", () => {
    expect(getRoleDefinition("promptEditor").label).toBe("Prompt editor");
  });
});

describe("requiredRoles", () => {
  it("marks promptEditor, generateButton, and downloadButton as required", () => {
    expect(requiredRoles().sort()).toEqual(["downloadButton", "generateButton", "promptEditor"].sort());
  });

  it("does not mark the informational selectors as required", () => {
    const required = new Set(requiredRoles());
    expect(required.has("modelSelector")).toBe(false);
    expect(required.has("aspectRatioSelector")).toBe(false);
    expect(required.has("imageQualitySelector")).toBe(false);
    expect(required.has("referenceImageUpload")).toBe(false);
  });
});
