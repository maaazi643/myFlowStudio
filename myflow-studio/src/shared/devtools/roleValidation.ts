import type { ElementSnapshot } from "./elementSnapshot";
import type { CapturableElementRole } from "./roles";
import { getRoleDefinition } from "./roles";

export interface RoleValidationResult {
  /** Validation only ever warns — it never blocks a capture the user deliberately made by clicking. */
  valid: true;
  warning?: string | undefined;
}

function attributeType(snapshot: ElementSnapshot): string {
  return (snapshot.attributes.type ?? "").toLowerCase();
}

function attributeRole(snapshot: ElementSnapshot): string {
  return (snapshot.attributes.role ?? "").toLowerCase();
}

function isEditableLike(snapshot: ElementSnapshot): boolean {
  const tag = snapshot.tagName.toLowerCase();
  if (tag === "textarea") {
    return true;
  }
  if (tag === "input") {
    const type = attributeType(snapshot) || "text";
    return ["text", "search", "url", "email"].includes(type);
  }
  return snapshot.attributes.contenteditable === "true";
}

function isButtonLike(snapshot: ElementSnapshot): boolean {
  const tag = snapshot.tagName.toLowerCase();
  if (tag === "button" || tag === "a") {
    return true;
  }
  if (tag === "input" && ["button", "submit"].includes(attributeType(snapshot))) {
    return true;
  }
  return attributeRole(snapshot) === "button";
}

function isFileUploadLike(snapshot: ElementSnapshot): boolean {
  const tag = snapshot.tagName.toLowerCase();
  if (tag === "input" && attributeType(snapshot) === "file") {
    return true;
  }
  // Custom upload triggers are usually a button that opens a hidden file input.
  return isButtonLike(snapshot);
}

function isDropdownLike(snapshot: ElementSnapshot): boolean {
  const tag = snapshot.tagName.toLowerCase();
  if (tag === "select") {
    return true;
  }
  if (["combobox", "listbox", "menu"].includes(attributeRole(snapshot))) {
    return true;
  }
  // Custom dropdown triggers are usually a button that opens a menu/listbox.
  return isButtonLike(snapshot);
}

const ROLE_CHECKS: Record<CapturableElementRole, (snapshot: ElementSnapshot) => boolean> = {
  promptBox: isEditableLike,
  generateButton: isButtonLike,
  downloadButton: isButtonLike,
  referenceUpload: isFileUploadLike,
  modelSelector: isDropdownLike,
  aspectRatioSelector: isDropdownLike,
  qualitySelector: isDropdownLike,
};

/** A soft check that the captured element's kind is plausible for its role — never rejects the user's click. */
export function validateElementForRole(
  role: CapturableElementRole,
  snapshot: ElementSnapshot,
): RoleValidationResult {
  if (ROLE_CHECKS[role](snapshot)) {
    return { valid: true };
  }
  const definition = getRoleDefinition(role);
  return {
    valid: true,
    warning: `That doesn't look like ${definition.expectedKind} — captured anyway, but double-check it's the right element.`,
  };
}
