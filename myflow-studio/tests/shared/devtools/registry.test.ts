import { describe, expect, it } from "vitest";
import {
  capturedRoleCount,
  isRegistryComplete,
  missingRequiredRoles,
} from "@shared/devtools/registry";
import type { CapturedSelector, SelectorRegistry } from "@shared/devtools/registry";

function makeCaptured(role: CapturedSelector["role"]): CapturedSelector {
  return {
    role,
    selector: `#${role}`,
    confidence: "high",
    reason: "id attribute",
    tagName: "button",
    pageUrl: "https://labs.google/fx/tools/flow",
    capturedAt: Date.now(),
  };
}

describe("isRegistryComplete / missingRequiredRoles", () => {
  it("is incomplete when empty", () => {
    const registry: SelectorRegistry = {};
    expect(isRegistryComplete(registry)).toBe(false);
    expect(missingRequiredRoles(registry)).toEqual([
      "promptBox",
      "generateButton",
      "downloadButton",
    ]);
  });

  it("is incomplete when only some required roles are captured", () => {
    const registry: SelectorRegistry = { promptBox: makeCaptured("promptBox") };
    expect(isRegistryComplete(registry)).toBe(false);
    expect(missingRequiredRoles(registry)).toEqual(["generateButton", "downloadButton"]);
  });

  it("is complete once all required roles are captured, regardless of optional ones", () => {
    const registry: SelectorRegistry = {
      promptBox: makeCaptured("promptBox"),
      generateButton: makeCaptured("generateButton"),
      downloadButton: makeCaptured("downloadButton"),
    };
    expect(isRegistryComplete(registry)).toBe(true);
    expect(missingRequiredRoles(registry)).toEqual([]);
  });
});

describe("capturedRoleCount", () => {
  it("counts zero for an empty registry", () => {
    expect(capturedRoleCount({})).toBe(0);
  });

  it("counts every captured role, required or optional", () => {
    const registry: SelectorRegistry = {
      promptBox: makeCaptured("promptBox"),
      modelSelector: makeCaptured("modelSelector"),
    };
    expect(capturedRoleCount(registry)).toBe(2);
  });
});
