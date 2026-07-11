import type { ElementSnapshot } from "./elementSnapshot";

/**
 * Generic DOM-shape classification — no Google Flow specifics anywhere.
 * This is what lets the picker prefer a real editable/interactive element
 * over a decorative placeholder <p> or wrapper <div> automatically, instead
 * of just capturing whatever the user's cursor happened to land on.
 */

function attribute(snapshot: ElementSnapshot, name: string): string {
  return (snapshot.attributes[name] ?? "").toLowerCase();
}

export function isEditableSnapshot(snapshot: ElementSnapshot): boolean {
  const tag = snapshot.tagName;
  if (tag === "textarea") {
    return true;
  }
  if (tag === "input") {
    const type = attribute(snapshot, "type") || "text";
    return ["text", "search", "url", "email"].includes(type);
  }
  if (attribute(snapshot, "contenteditable") === "true") {
    return true;
  }
  return attribute(snapshot, "role") === "textbox";
}

const INTERACTIVE_TAGS = new Set(["button", "a", "select"]);
const INTERACTIVE_INPUT_TYPES = new Set(["button", "submit", "file", "checkbox", "radio"]);
const INTERACTIVE_ROLES = new Set([
  "button",
  "combobox",
  "listbox",
  "menu",
  "menuitem",
  "switch",
  "checkbox",
  "tab",
]);

export function isInteractiveSnapshot(snapshot: ElementSnapshot): boolean {
  if (isEditableSnapshot(snapshot)) {
    return true;
  }
  if (INTERACTIVE_TAGS.has(snapshot.tagName)) {
    return true;
  }
  if (snapshot.tagName === "input" && INTERACTIVE_INPUT_TYPES.has(attribute(snapshot, "type"))) {
    return true;
  }
  return INTERACTIVE_ROLES.has(attribute(snapshot, "role"));
}

/**
 * Flags elements that are structurally marked as non-content or inert —
 * the placeholder `<p>` a rich-text editor shows when empty is typically
 * `aria-hidden="true"` or `contenteditable="false"` inside a genuinely
 * editable ancestor, which is exactly the case reported: capturing the
 * placeholder instead of the real editor root.
 */
export function isLikelyDecorative(snapshot: ElementSnapshot): boolean {
  if (attribute(snapshot, "aria-hidden") === "true") {
    return true;
  }
  return attribute(snapshot, "contenteditable") === "false";
}

/** Higher is a better capture candidate. */
export function scoreCandidate(snapshot: ElementSnapshot): number {
  if (isLikelyDecorative(snapshot)) {
    return 0;
  }
  if (isEditableSnapshot(snapshot)) {
    return 3;
  }
  if (isInteractiveSnapshot(snapshot)) {
    return 2;
  }
  return 1;
}

/**
 * Ranks candidate element snapshots best-first — interactive/editable and
 * non-decorative wins, ties broken by original order (nearest-to-the-click
 * first, since that's how the content script collects them). Returns
 * indexes into the input array rather than reordering it directly, so the
 * caller can apply the same order to a parallel array of live Elements
 * (which can't cross into this pure module).
 */
export function rankCandidateIndexes(snapshots: readonly ElementSnapshot[]): number[] {
  return snapshots
    .map((snapshot, index) => ({ index, score: scoreCandidate(snapshot) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.index);
}
