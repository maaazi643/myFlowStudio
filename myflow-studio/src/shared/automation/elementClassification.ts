import type { ElementKind } from "./roles";

/**
 * A plain, DOM-independent snapshot of a candidate element's tag and
 * attributes, so this classification logic can be unit tested without a
 * DOM and reused identically from the content script's real scan.
 */
export interface AttributeBag {
  tagName: string;
  attributes: Record<string, string>;
}

function attr(bag: AttributeBag, name: string): string {
  return bag.attributes[name] ?? "";
}

export function isEditableKind(bag: AttributeBag): boolean {
  const tag = bag.tagName.toLowerCase();
  if (tag === "textarea") {
    return true;
  }
  if (tag === "input") {
    const type = attr(bag, "type").toLowerCase();
    return type === "" || type === "text" || type === "search";
  }
  if (attr(bag, "contenteditable").toLowerCase() === "true") {
    return true;
  }
  return attr(bag, "role") === "textbox";
}

export function isButtonKind(bag: AttributeBag): boolean {
  const tag = bag.tagName.toLowerCase();
  if (tag === "button") {
    return true;
  }
  if (tag === "input") {
    const type = attr(bag, "type").toLowerCase();
    return type === "submit" || type === "button";
  }
  if (attr(bag, "role") === "button") {
    return true;
  }
  return tag === "a" && attr(bag, "role") === "button";
}

export function isFileInputKind(bag: AttributeBag): boolean {
  return bag.tagName.toLowerCase() === "input" && attr(bag, "type").toLowerCase() === "file";
}

/** aria-haspopup values that indicate a value-picker trigger, as opposed to a modal/dialog opener or a generic disclosure. */
const DROPDOWN_HASPOPUP_VALUES = new Set(["true", "menu", "listbox"]);

export function isDropdownKind(bag: AttributeBag): boolean {
  const tag = bag.tagName.toLowerCase();
  if (tag === "select") {
    return true;
  }
  const role = attr(bag, "role");
  if (role === "combobox" || role === "listbox") {
    return true;
  }
  if (tag !== "button") {
    return false;
  }
  const hasPopup = attr(bag, "aria-haspopup").toLowerCase();
  // A bare `aria-haspopup` with no value defaults to "true" per the ARIA spec.
  return hasPopup === "" ? "aria-haspopup" in bag.attributes : DROPDOWN_HASPOPUP_VALUES.has(hasPopup);
}

export const KIND_CHECK: Record<ElementKind, (bag: AttributeBag) => boolean> = {
  editable: isEditableKind,
  button: isButtonKind,
  fileInput: isFileInputKind,
  dropdown: isDropdownKind,
};

export const KIND_SELECTOR: Record<ElementKind, string> = {
  editable:
    "textarea, input[type='text'], input[type='search'], input:not([type]), [contenteditable='true'], [role='textbox']",
  button: "button, [role='button'], input[type='submit'], input[type='button'], a[role='button']",
  fileInput: "input[type='file']",
  dropdown: "select, [role='combobox'], [role='listbox'], button[aria-haspopup]",
};

export function isDecorative(bag: AttributeBag): boolean {
  return attr(bag, "aria-hidden").toLowerCase() === "true";
}
