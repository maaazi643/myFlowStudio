import { describe, expect, it } from "vitest";
import {
  isEditableSnapshot,
  isInteractiveSnapshot,
  isLikelyDecorative,
  rankCandidateIndexes,
  scoreCandidate,
} from "@shared/devtools/elementClassification";
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

describe("isEditableSnapshot", () => {
  it("accepts a textarea", () => {
    expect(isEditableSnapshot(makeSnapshot({ tagName: "textarea" }))).toBe(true);
  });

  it("accepts a contenteditable=true div", () => {
    expect(
      isEditableSnapshot(makeSnapshot({ tagName: "div", attributes: { contenteditable: "true" } })),
    ).toBe(true);
  });

  it("accepts role=textbox", () => {
    expect(
      isEditableSnapshot(makeSnapshot({ tagName: "div", attributes: { role: "textbox" } })),
    ).toBe(true);
  });

  it("rejects a contenteditable=false div (the classic placeholder-node case)", () => {
    expect(
      isEditableSnapshot(makeSnapshot({ tagName: "p", attributes: { contenteditable: "false" } })),
    ).toBe(false);
  });

  it("rejects a plain div", () => {
    expect(isEditableSnapshot(makeSnapshot({ tagName: "div" }))).toBe(false);
  });
});

describe("isInteractiveSnapshot", () => {
  it("editable elements are also interactive", () => {
    expect(isInteractiveSnapshot(makeSnapshot({ tagName: "textarea" }))).toBe(true);
  });

  it("accepts a button", () => {
    expect(isInteractiveSnapshot(makeSnapshot({ tagName: "button" }))).toBe(true);
  });

  it("accepts role=combobox", () => {
    expect(
      isInteractiveSnapshot(makeSnapshot({ tagName: "div", attributes: { role: "combobox" } })),
    ).toBe(true);
  });

  it("rejects a plain span", () => {
    expect(isInteractiveSnapshot(makeSnapshot({ tagName: "span" }))).toBe(false);
  });
});

describe("isLikelyDecorative", () => {
  it("flags aria-hidden=true", () => {
    expect(isLikelyDecorative(makeSnapshot({ attributes: { "aria-hidden": "true" } }))).toBe(true);
  });

  it("flags contenteditable=false", () => {
    expect(isLikelyDecorative(makeSnapshot({ attributes: { contenteditable: "false" } }))).toBe(
      true,
    );
  });

  it("does not flag an ordinary element", () => {
    expect(isLikelyDecorative(makeSnapshot())).toBe(false);
  });
});

describe("scoreCandidate", () => {
  it("ranks decorative below everything else, even if it looks editable", () => {
    const decorativeButEditableTag = makeSnapshot({
      tagName: "div",
      attributes: { contenteditable: "true", "aria-hidden": "true" },
    });
    expect(scoreCandidate(decorativeButEditableTag)).toBe(0);
  });

  it("ranks editable above merely-interactive", () => {
    const editable = scoreCandidate(makeSnapshot({ tagName: "textarea" }));
    const interactive = scoreCandidate(makeSnapshot({ tagName: "button" }));
    expect(editable).toBeGreaterThan(interactive);
  });

  it("ranks merely-interactive above plain elements", () => {
    const interactive = scoreCandidate(makeSnapshot({ tagName: "button" }));
    const plain = scoreCandidate(makeSnapshot({ tagName: "div" }));
    expect(interactive).toBeGreaterThan(plain);
  });
});

describe("rankCandidateIndexes", () => {
  it("puts the real contenteditable root ahead of the placeholder <p> inside it (the reported bug)", () => {
    // Simulates clicking on the placeholder text of a rich editor: the
    // click target is the <p>, its parent is the real contenteditable root.
    const snapshots: ElementSnapshot[] = [
      makeSnapshot({ tagName: "p", attributes: { "aria-hidden": "true" } }), // clicked target: placeholder
      makeSnapshot({ tagName: "div", attributes: { contenteditable: "true", role: "textbox" } }), // parent: real editor
      makeSnapshot({ tagName: "div" }), // grandparent: generic wrapper
    ];
    expect(rankCandidateIndexes(snapshots)).toEqual([1, 2, 0]);
  });

  it("preserves original order among equally-scored candidates", () => {
    const snapshots: ElementSnapshot[] = [
      makeSnapshot({ tagName: "div" }),
      makeSnapshot({ tagName: "section" }),
      makeSnapshot({ tagName: "span" }),
    ];
    expect(rankCandidateIndexes(snapshots)).toEqual([0, 1, 2]);
  });

  it("returns an empty array for an empty input", () => {
    expect(rankCandidateIndexes([])).toEqual([]);
  });
});
