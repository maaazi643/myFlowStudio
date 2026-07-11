import { describe, expect, it } from "vitest";
import {
  isButtonKind,
  isDecorative,
  isDropdownKind,
  isEditableKind,
  isFileInputKind,
} from "@shared/automation/elementClassification";
import type { AttributeBag } from "@shared/automation/elementClassification";

function bag(tagName: string, attributes: Record<string, string> = {}): AttributeBag {
  return { tagName, attributes };
}

describe("isEditableKind", () => {
  it("recognizes textarea, text/search inputs, contenteditable, and role=textbox", () => {
    expect(isEditableKind(bag("TEXTAREA"))).toBe(true);
    expect(isEditableKind(bag("INPUT", { type: "text" }))).toBe(true);
    expect(isEditableKind(bag("INPUT", { type: "search" }))).toBe(true);
    expect(isEditableKind(bag("INPUT"))).toBe(true);
    expect(isEditableKind(bag("DIV", { contenteditable: "true" }))).toBe(true);
    expect(isEditableKind(bag("DIV", { role: "textbox" }))).toBe(true);
  });

  it("rejects non-editable kinds", () => {
    expect(isEditableKind(bag("INPUT", { type: "checkbox" }))).toBe(false);
    expect(isEditableKind(bag("BUTTON"))).toBe(false);
  });
});

describe("isButtonKind", () => {
  it("recognizes button, submit/button inputs, role=button, and anchor role=button", () => {
    expect(isButtonKind(bag("BUTTON"))).toBe(true);
    expect(isButtonKind(bag("INPUT", { type: "submit" }))).toBe(true);
    expect(isButtonKind(bag("INPUT", { type: "button" }))).toBe(true);
    expect(isButtonKind(bag("DIV", { role: "button" }))).toBe(true);
    expect(isButtonKind(bag("A", { role: "button" }))).toBe(true);
  });

  it("rejects a plain anchor without role=button", () => {
    expect(isButtonKind(bag("A"))).toBe(false);
  });
});

describe("isFileInputKind", () => {
  it("only recognizes input[type=file]", () => {
    expect(isFileInputKind(bag("INPUT", { type: "file" }))).toBe(true);
    expect(isFileInputKind(bag("INPUT", { type: "text" }))).toBe(false);
    expect(isFileInputKind(bag("BUTTON"))).toBe(false);
  });
});

describe("isDropdownKind", () => {
  it("recognizes select, combobox/listbox roles, and buttons with a value-picker aria-haspopup", () => {
    expect(isDropdownKind(bag("SELECT"))).toBe(true);
    expect(isDropdownKind(bag("DIV", { role: "combobox" }))).toBe(true);
    expect(isDropdownKind(bag("DIV", { role: "listbox" }))).toBe(true);
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "listbox" }))).toBe(true);
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "menu" }))).toBe(true);
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "true" }))).toBe(true);
    // A bare aria-haspopup with no value defaults to "true" per the ARIA spec.
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "" }))).toBe(true);
  });

  it("rejects a plain button with no popup", () => {
    expect(isDropdownKind(bag("BUTTON"))).toBe(false);
  });

  it("rejects aria-haspopup values that open a dialog/grid/tree rather than a value picker", () => {
    // Regression: a real Google Flow page mixed several dialog-opener
    // buttons in among its real dropdown triggers, which inflated the
    // model/aspect-ratio/quality candidate pools past the ambiguity
    // threshold and made discovery give up on all of them.
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "dialog" }))).toBe(false);
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "grid" }))).toBe(false);
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "tree" }))).toBe(false);
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "false" }))).toBe(false);
  });
});

describe("isDecorative", () => {
  it("flags aria-hidden=true elements", () => {
    expect(isDecorative(bag("SPAN", { "aria-hidden": "true" }))).toBe(true);
    expect(isDecorative(bag("SPAN"))).toBe(false);
  });
});
