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
  it("recognizes select, combobox/listbox roles, and buttons with aria-haspopup", () => {
    expect(isDropdownKind(bag("SELECT"))).toBe(true);
    expect(isDropdownKind(bag("DIV", { role: "combobox" }))).toBe(true);
    expect(isDropdownKind(bag("DIV", { role: "listbox" }))).toBe(true);
    expect(isDropdownKind(bag("BUTTON", { "aria-haspopup": "listbox" }))).toBe(true);
  });

  it("rejects a plain button with no popup", () => {
    expect(isDropdownKind(bag("BUTTON"))).toBe(false);
  });
});

describe("isDecorative", () => {
  it("flags aria-hidden=true elements", () => {
    expect(isDecorative(bag("SPAN", { "aria-hidden": "true" }))).toBe(true);
    expect(isDecorative(bag("SPAN"))).toBe(false);
  });
});
