import { buildSelectorCandidates, pickWinningCandidate } from "@shared/devtools/selectorBuilder";
import { validateElementForRole } from "@shared/devtools/roleValidation";
import { isContentCommand } from "@shared/devtools/contentProtocol";
import type { CaptureResultEvent } from "@shared/devtools/contentProtocol";
import type { CapturableElementRole } from "@shared/devtools/roles";
import type { ElementSnapshot } from "@shared/devtools/elementSnapshot";

const SNAPSHOT_ATTRIBUTES = [
  "data-testid",
  "data-test-id",
  "data-test",
  "aria-label",
  "name",
  "role",
  "placeholder",
  "type",
  "contenteditable",
];
const MAX_ANCESTOR_DEPTH = 8;
const HIGHLIGHT_ID = "myflow-studio-picker-highlight";
const BADGE_ID = "myflow-studio-picker-badge";

let pickingRole: CapturableElementRole | null = null;
let highlightEl: HTMLDivElement | null = null;
let badgeEl: HTMLDivElement | null = null;

function nthChildOf(el: Element): number {
  const parent = el.parentElement;
  if (!parent) {
    return 1;
  }
  return Array.from(parent.children).indexOf(el) + 1;
}

function toSnapshot(el: Element): ElementSnapshot {
  const attributes: Record<string, string> = {};
  for (const name of SNAPSHOT_ATTRIBUTES) {
    const value = el.getAttribute(name);
    if (value !== null) {
      attributes[name] = value;
    }
  }
  return {
    tagName: el.tagName.toLowerCase(),
    id: el.id || undefined,
    classNames: Array.from(el.classList),
    attributes,
    nthChild: nthChildOf(el),
  };
}

function collectAncestors(el: Element): ElementSnapshot[] {
  const ancestors: ElementSnapshot[] = [];
  let current = el.parentElement;
  let depth = 0;
  while (current && depth < MAX_ANCESTOR_DEPTH) {
    ancestors.push(toSnapshot(current));
    current = current.parentElement;
    depth += 1;
  }
  return ancestors;
}

function isUniqueSelector(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function ensureOverlayElements(): void {
  if (!highlightEl) {
    highlightEl = document.createElement("div");
    highlightEl.id = HIGHLIGHT_ID;
    Object.assign(highlightEl.style, {
      position: "fixed",
      pointerEvents: "none",
      zIndex: "2147483647",
      border: "2px solid #4f7cff",
      background: "rgba(79, 124, 255, 0.15)",
      borderRadius: "3px",
      transition: "all 60ms ease-out",
      display: "none",
    } satisfies Partial<CSSStyleDeclaration>);
    document.documentElement.appendChild(highlightEl);
  }
  if (!badgeEl) {
    badgeEl = document.createElement("div");
    badgeEl.id = BADGE_ID;
    Object.assign(badgeEl.style, {
      position: "fixed",
      top: "12px",
      right: "12px",
      zIndex: "2147483647",
      background: "#1a1a2e",
      color: "#fff",
      font: "600 12px system-ui, sans-serif",
      padding: "8px 12px",
      borderRadius: "6px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
    } satisfies Partial<CSSStyleDeclaration>);
    document.documentElement.appendChild(badgeEl);
  }
}

function removeOverlayElements(): void {
  highlightEl?.remove();
  badgeEl?.remove();
  highlightEl = null;
  badgeEl = null;
}

function positionHighlight(target: Element): void {
  if (!highlightEl) {
    return;
  }
  const rect = target.getBoundingClientRect();
  highlightEl.style.display = "block";
  highlightEl.style.left = `${String(rect.left)}px`;
  highlightEl.style.top = `${String(rect.top)}px`;
  highlightEl.style.width = `${String(rect.width)}px`;
  highlightEl.style.height = `${String(rect.height)}px`;
}

function handleMouseMove(event: MouseEvent): void {
  const target = event.target;
  if (target instanceof Element && target !== highlightEl && target !== badgeEl) {
    positionHighlight(target);
  }
}

function handleClick(event: MouseEvent): void {
  const target = event.target;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  if (!(target instanceof Element) || !pickingRole) {
    return;
  }
  captureElement(target, pickingRole);
  stopPicking();
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" && pickingRole) {
    const role = pickingRole;
    stopPicking();
    chrome.runtime.sendMessage({ type: "MYFLOW_CAPTURE_CANCELLED", role }).catch(() => undefined);
  }
}

function captureElement(target: Element, role: CapturableElementRole): void {
  const snapshot = toSnapshot(target);
  const ancestors = collectAncestors(target);
  const candidates = buildSelectorCandidates(snapshot, ancestors);
  const { candidate, guaranteedUnique } = pickWinningCandidate(candidates, isUniqueSelector);
  const roleCheck = validateElementForRole(role, snapshot);

  const warnings = [
    roleCheck.warning,
    guaranteedUnique
      ? undefined
      : "Couldn't confirm this selector is unique on the page — it may match more than one element.",
  ].filter((warning): warning is string => Boolean(warning));

  const result: CaptureResultEvent = {
    type: "MYFLOW_CAPTURE_RESULT",
    role,
    selector: candidate.selector,
    confidence: guaranteedUnique ? candidate.confidence : "low",
    reason: candidate.reason,
    tagName: snapshot.tagName,
    warning: warnings.length > 0 ? warnings.join(" ") : undefined,
    pageUrl: window.location.href,
  };
  chrome.runtime.sendMessage(result).catch(() => undefined);
}

function startPicking(role: CapturableElementRole): void {
  stopPicking();
  pickingRole = role;
  ensureOverlayElements();
  if (badgeEl) {
    badgeEl.textContent = `MyFlow Studio — click the ${role} element (Esc to cancel)`;
  }
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", handleKeyDown, true);
}

function stopPicking(): void {
  pickingRole = null;
  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("keydown", handleKeyDown, true);
  removeOverlayElements();
}

console.info("[MyFlow Studio] Developer Mode content script ready on", window.location.href);

chrome.runtime.onMessage.addListener((message) => {
  if (!isContentCommand(message)) {
    return;
  }
  if (message.type === "MYFLOW_START_PICKING") {
    startPicking(message.role);
  } else {
    stopPicking();
  }
});
