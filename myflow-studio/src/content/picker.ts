import { buildSelectorCandidates, pickWinningCandidate } from "@shared/devtools/selectorBuilder";
import { validateElementForRole } from "@shared/devtools/roleValidation";
import { rankCandidateIndexes } from "@shared/devtools/elementClassification";
import { getRoleDefinition } from "@shared/devtools/roles";
import type { CaptureResultEvent } from "@shared/devtools/contentProtocol";
import type { CapturableElementRole } from "@shared/devtools/roles";
import type { ElementSnapshot } from "@shared/devtools/elementSnapshot";
import { escapeHtml } from "./utils";
import { log } from "./logging";

const SNAPSHOT_ATTRIBUTES = [
  "data-testid",
  "data-test-id",
  "data-test",
  "aria-label",
  "aria-hidden",
  "name",
  "role",
  "placeholder",
  "type",
  "contenteditable",
];
const MAX_ANCESTOR_DEPTH = 8;
const MAX_DESCENDANT_CANDIDATES = 6;
const MAX_DESCENDANTS_VISITED = 300;

const HIGHLIGHT_ID = "myflow-studio-picker-highlight";
const BADGE_ID = "myflow-studio-picker-badge";
const TOOLBAR_HOST_ID = "myflow-studio-picker-toolbar-host";

let pickingRole: CapturableElementRole | null = null;
let highlightEl: HTMLDivElement | null = null;
let badgeEl: HTMLDivElement | null = null;
let toolbarHost: HTMLDivElement | null = null;
let toolbarShadow: ShadowRoot | null = null;

interface ConfirmState {
  role: CapturableElementRole;
  candidates: Element[];
  index: number;
}
let confirmState: ConfirmState | null = null;

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

/** A small bounded set of interactive/editable descendants — covers "clicked a container instead of the real control" without scanning the whole subtree. */
function boundedInteractiveDescendants(root: Element): Element[] {
  const results: Element[] = [];
  const queue: Element[] = Array.from(root.children);
  let visited = 0;
  while (
    queue.length > 0 &&
    visited < MAX_DESCENDANTS_VISITED &&
    results.length < MAX_DESCENDANT_CANDIDATES
  ) {
    const el = queue.shift();
    if (!el) {
      break;
    }
    visited += 1;
    results.push(el);
    queue.push(...Array.from(el.children));
  }
  return results;
}

function ancestorChainFrom(el: Element): Element[] {
  const chain: Element[] = [el];
  let current = el.parentElement;
  let depth = 0;
  while (current && depth < MAX_ANCESTOR_DEPTH) {
    chain.push(current);
    current = current.parentElement;
    depth += 1;
  }
  return chain;
}

/** Ranks the clicked element, its ancestors, and a handful of its interactive descendants — best guess first. */
function rankedCandidatesFor(target: Element): Element[] {
  const elements = [...ancestorChainFrom(target), ...boundedInteractiveDescendants(target)];
  const snapshots = elements.map(toSnapshot);
  const order = rankCandidateIndexes(snapshots);
  const ranked: Element[] = [];
  for (const index of order) {
    const el = elements[index];
    if (el) {
      ranked.push(el);
    }
  }
  return ranked;
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

function setHighlightColor(color: string, backgroundColor: string): void {
  if (!highlightEl) {
    return;
  }
  highlightEl.style.border = `2px solid ${color}`;
  highlightEl.style.background = backgroundColor;
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

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" && pickingRole) {
    const role = pickingRole;
    stopPicking();
    log.info("Capture cancelled (Escape pressed before selecting an element).", { role });
    chrome.runtime.sendMessage({ type: "MYFLOW_CAPTURE_CANCELLED", role }).catch(() => undefined);
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
  const role = pickingRole;
  const candidates = rankedCandidatesFor(target);
  stopPicking();
  enterConfirmMode(role, candidates);
}

function describeCandidate(el: Element): { tagLabel: string; preview: string } {
  const snapshot = toSnapshot(el);
  const attrs: string[] = [];
  if (snapshot.attributes.contenteditable === "true") {
    attrs.push("contenteditable");
  }
  if (snapshot.attributes.role) {
    attrs.push(`role="${snapshot.attributes.role}"`);
  }
  if (snapshot.id) {
    attrs.push(`id="${snapshot.id}"`);
  }
  const tagLabel =
    attrs.length > 0 ? `<${snapshot.tagName} ${attrs.join(" ")}>` : `<${snapshot.tagName}>`;
  const preview = el.textContent.trim().replace(/\s+/g, " ").slice(0, 60);
  return { tagLabel, preview };
}

function renderToolbar(): void {
  if (!confirmState) {
    return;
  }
  const candidate = confirmState.candidates[confirmState.index];
  if (!candidate) {
    return;
  }
  setHighlightColor("#2ecc71", "rgba(46, 204, 113, 0.18)");
  positionHighlight(candidate);

  const shadow = ensureToolbar();
  const { tagLabel, preview } = describeCandidate(candidate);
  const roleLabel = getRoleDefinition(confirmState.role).label;

  shadow.innerHTML = `
    <style>
      .panel {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 2147483647;
        background: #1a1a2e;
        color: #fff;
        font: 12px/1.4 system-ui, sans-serif;
        padding: 10px 12px;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        max-width: 320px;
      }
      .info { margin-bottom: 8px; }
      .role { font-weight: 700; display: block; margin-bottom: 2px; }
      .tag { display: block; font-family: monospace; color: #9fd8a9; margin-bottom: 2px; word-break: break-all; }
      .count { display: block; color: #aaa; margin-bottom: 2px; }
      .preview { display: block; color: #ddd; font-style: italic; word-break: break-word; }
      .actions { display: flex; gap: 6px; flex-wrap: wrap; }
      button {
        font: inherit;
        cursor: pointer;
        border: none;
        border-radius: 5px;
        padding: 5px 9px;
        background: #33335a;
        color: #fff;
      }
      button[data-action="confirm"] { background: #2ecc71; color: #06280f; font-weight: 700; }
      button[data-action="cancel"] { background: #e74c3c; }
      .hint { margin-top: 6px; color: #999; font-size: 10px; }
    </style>
    <div class="panel">
      <div class="info">
        <span class="role">${escapeHtml(roleLabel)}</span>
        <span class="tag">${escapeHtml(tagLabel)}</span>
        <span class="count">Candidate ${String(confirmState.index + 1)} of ${String(confirmState.candidates.length)}</span>
        ${preview ? `<span class="preview">"${escapeHtml(preview)}"</span>` : ""}
      </div>
      <div class="actions">
        <button type="button" data-action="prev">◀ Prev</button>
        <button type="button" data-action="next">Next ▶</button>
        <button type="button" data-action="confirm">✓ Use this element</button>
        <button type="button" data-action="cancel">✕ Cancel</button>
      </div>
      <div class="hint">Click a different element on the page to re-target, or use ←/→ and Enter/Esc.</div>
    </div>
  `;

  shadow.querySelector("[data-action='prev']")?.addEventListener("click", (e) => {
    e.stopPropagation();
    cycleCandidate(-1);
  });
  shadow.querySelector("[data-action='next']")?.addEventListener("click", (e) => {
    e.stopPropagation();
    cycleCandidate(1);
  });
  shadow.querySelector("[data-action='confirm']")?.addEventListener("click", (e) => {
    e.stopPropagation();
    confirmCandidate();
  });
  shadow.querySelector("[data-action='cancel']")?.addEventListener("click", (e) => {
    e.stopPropagation();
    cancelConfirm();
  });
}

function ensureToolbar(): ShadowRoot {
  if (toolbarHost && toolbarShadow) {
    return toolbarShadow;
  }
  const host = document.createElement("div");
  host.id = TOOLBAR_HOST_ID;
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  toolbarHost = host;
  toolbarShadow = shadow;
  return shadow;
}

function removeToolbar(): void {
  toolbarHost?.remove();
  toolbarHost = null;
  toolbarShadow = null;
}

function cycleCandidate(delta: number): void {
  if (!confirmState) {
    return;
  }
  const len = confirmState.candidates.length;
  confirmState.index = (confirmState.index + delta + len) % len;
  renderToolbar();
}

function confirmCandidate(): void {
  if (!confirmState) {
    return;
  }
  const candidate = confirmState.candidates[confirmState.index];
  const role = confirmState.role;
  exitConfirmMode();
  if (candidate) {
    captureElement(candidate, role);
  }
}

function cancelConfirm(): void {
  if (!confirmState) {
    return;
  }
  const role = confirmState.role;
  exitConfirmMode();
  log.info("Capture cancelled before confirming.", { role });
  chrome.runtime.sendMessage({ type: "MYFLOW_CAPTURE_CANCELLED", role }).catch(() => undefined);
}

function handleConfirmClick(event: MouseEvent): void {
  const target = event.target;
  if (toolbarHost && target === toolbarHost) {
    // Click landed inside our own shadow-DOM toolbar — its own button
    // listeners handle it; don't reprocess as "clicked a new page element".
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  if (!(target instanceof Element) || !confirmState) {
    return;
  }
  const role = confirmState.role;
  const candidates = rankedCandidatesFor(target);
  confirmState = { role, candidates, index: 0 };
  renderToolbar();
}

function handleConfirmKeyDown(event: KeyboardEvent): void {
  if (!confirmState) {
    return;
  }
  if (event.key === "Escape") {
    cancelConfirm();
  } else if (event.key === "Enter") {
    confirmCandidate();
  } else if (event.key === "ArrowRight" || event.key === "Tab") {
    event.preventDefault();
    cycleCandidate(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    cycleCandidate(-1);
  }
}

function enterConfirmMode(role: CapturableElementRole, candidates: Element[]): void {
  confirmState = { role, candidates, index: 0 };
  ensureOverlayElements();
  document.addEventListener("click", handleConfirmClick, true);
  document.addEventListener("keydown", handleConfirmKeyDown, true);
  renderToolbar();
}

function exitConfirmMode(): void {
  confirmState = null;
  document.removeEventListener("click", handleConfirmClick, true);
  document.removeEventListener("keydown", handleConfirmKeyDown, true);
  removeToolbar();
  removeOverlayElements();
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
  log.info(`Captured ${role}: ${candidate.selector} (confirmed by user)`, {
    role,
    selector: candidate.selector,
    confidence: result.confidence,
  });
  chrome.runtime.sendMessage(result).catch(() => undefined);
}

export function startPicking(role: CapturableElementRole): void {
  stopPicking();
  pickingRole = role;
  ensureOverlayElements();
  setHighlightColor("#4f7cff", "rgba(79, 124, 255, 0.15)");
  if (badgeEl) {
    badgeEl.textContent = `MyFlow Studio — click the ${role} element (Esc to cancel)`;
  }
  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", handleKeyDown, true);
}

export function stopPicking(): void {
  pickingRole = null;
  document.removeEventListener("mousemove", handleMouseMove, true);
  document.removeEventListener("click", handleClick, true);
  document.removeEventListener("keydown", handleKeyDown, true);
  removeOverlayElements();
  if (confirmState) {
    exitConfirmMode();
  }
}
