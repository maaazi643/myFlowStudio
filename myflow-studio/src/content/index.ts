import { buildSelectorCandidates, pickWinningCandidate } from "@shared/devtools/selectorBuilder";
import { validateElementForRole } from "@shared/devtools/roleValidation";
import { isContentCommand } from "@shared/devtools/contentProtocol";
import type { CaptureResultEvent } from "@shared/devtools/contentProtocol";
import type { CapturableElementRole } from "@shared/devtools/roles";
import type { ElementSnapshot } from "@shared/devtools/elementSnapshot";
import { isRunAutomationCommand } from "@shared/automation/contentAutomationProtocol";
import type {
  AutomationCompleteEvent,
  RunAutomationCommand,
} from "@shared/automation/contentAutomationProtocol";

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function base64ToFile(fileName: string, mimeType: string, dataBase64: string): File {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: mimeType });
}

/**
 * Sets a value on a real input/textarea (or contenteditable) so React (or
 * any framework using the same native-setter override trick) actually
 * notices the change — assigning `.value` directly gets silently
 * swallowed by React's controlled-input tracking, so the native setter has
 * to be invoked explicitly before dispatching the input event.
 */
function setElementText(el: Element, text: string): boolean {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called via .call(el, ...) below, so binding is explicit.
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    nativeSetter?.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }
  if (el.getAttribute("contenteditable") === "true") {
    el.textContent = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  return false;
}

/** Only works for a real file input — a custom upload trigger (button) can't be driven this way, browsers block programmatic file selection. */
function setElementFiles(el: Element, files: File[]): boolean {
  if (!(el instanceof HTMLInputElement) || el.type !== "file") {
    return false;
  }
  const transfer = new DataTransfer();
  for (const file of files) {
    transfer.items.add(file);
  }
  el.files = transfer.files;
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function isClickable(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  if ("disabled" in el && el.disabled === true) {
    return false;
  }
  return el.offsetParent !== null;
}

async function waitForClickable(selector: string, timeoutMs: number): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeoutMs;
  const pollIntervalMs = 400;
  while (Date.now() < deadline) {
    const el = document.querySelector(selector);
    if (el && isClickable(el)) {
      return el;
    }
    await sleep(pollIntervalMs);
  }
  return null;
}

function reportAutomationResult(requestId: string, ok: boolean, error?: string): void {
  const event: AutomationCompleteEvent = {
    type: "MYFLOW_AUTOMATION_COMPLETE",
    requestId,
    ok,
    error,
  };
  chrome.runtime.sendMessage(event).catch(() => undefined);
}

async function runAutomation(command: RunAutomationCommand): Promise<void> {
  const { requestId, promptText, referenceImages, selectors, clickDownload, maxWaitMs } = command;
  try {
    const promptEl = document.querySelector(selectors.promptBox);
    if (!promptEl) {
      throw new Error(
        "Prompt box element wasn't found on the page — re-capture it in Developer Mode.",
      );
    }
    if (!setElementText(promptEl, promptText)) {
      throw new Error("Couldn't set text on the captured prompt box element.");
    }

    if (referenceImages.length > 0 && selectors.referenceUpload) {
      const uploadEl = document.querySelector(selectors.referenceUpload);
      if (uploadEl) {
        const files = referenceImages.map((image) =>
          base64ToFile(image.fileName, image.mimeType, image.dataBase64),
        );
        setElementFiles(uploadEl, files);
      }
    }

    const generateEl = document.querySelector(selectors.generateButton);
    if (!generateEl || !(generateEl instanceof HTMLElement)) {
      throw new Error(
        "Generate button element wasn't found on the page — re-capture it in Developer Mode.",
      );
    }
    generateEl.click();

    if (clickDownload && selectors.downloadButton) {
      const downloadEl = await waitForClickable(selectors.downloadButton, maxWaitMs);
      if (!downloadEl) {
        throw new Error("Timed out waiting for the download button to become available.");
      }
      downloadEl.click();
      await sleep(500);
    } else {
      await sleep(maxWaitMs);
    }

    reportAutomationResult(requestId, true);
  } catch (err) {
    reportAutomationResult(
      requestId,
      false,
      err instanceof Error ? err.message : "Automation failed.",
    );
  }
}

console.info("[MyFlow Studio] Developer Mode content script ready on", window.location.href);

chrome.runtime.onMessage.addListener((message) => {
  if (isRunAutomationCommand(message)) {
    void runAutomation(message);
    return;
  }
  if (!isContentCommand(message)) {
    return;
  }
  if (message.type === "MYFLOW_START_PICKING") {
    startPicking(message.role);
  } else {
    stopPicking();
  }
});
