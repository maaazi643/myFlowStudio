import type {
  AutomationCompleteEvent,
  RunAutomationCommand,
} from "@shared/automation/contentAutomationProtocol";
import { sleep } from "./utils";
import { log } from "./logging";

function base64ToFile(fileName: string, mimeType: string, dataBase64: string): File {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: mimeType });
}

function readBackText(el: Element): string {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return el.textContent;
}

function normalizeForComparison(text: string): string {
  return text.replace(/\s+/g, " ").trim();
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

export async function runAutomation(command: RunAutomationCommand): Promise<void> {
  const { requestId, promptText, referenceImages, selectors, clickDownload, maxWaitMs } = command;
  const ctx = { requestId };
  log.info("Automation run starting.", {
    ...ctx,
    promptBoxSelector: selectors.promptBox,
    generateButtonSelector: selectors.generateButton,
    downloadButtonSelector: selectors.downloadButton ?? "(not captured)",
  });

  try {
    const promptEl = document.querySelector(selectors.promptBox);
    if (!promptEl) {
      log.error(`Prompt box not found using selector "${selectors.promptBox}".`, ctx);
      throw new Error(
        "Prompt box element wasn't found on the page — re-capture it in Developer Mode.",
      );
    }
    log.info(`Prompt box found: <${promptEl.tagName.toLowerCase()}>.`, ctx);

    if (!setElementText(promptEl, promptText)) {
      log.error(
        "The captured prompt box element isn't an editable field (not a textarea/input/contenteditable).",
        ctx,
      );
      throw new Error("Couldn't set text on the captured prompt box element.");
    }
    const readBack = readBackText(promptEl);
    if (normalizeForComparison(readBack) !== normalizeForComparison(promptText)) {
      log.error(
        `Text insertion looks like it silently failed — expected "${promptText}", but the element now reads "${readBack}".`,
        ctx,
      );
      throw new Error(
        "The prompt text didn't actually appear in the editor after insertion — the page likely ignored the synthetic input event. Re-capture the prompt box in Developer Mode.",
      );
    }
    log.info("Prompt text inserted and verified by reading it back.", ctx);

    if (referenceImages.length > 0) {
      if (!selectors.referenceUpload) {
        log.warning(
          "Prompt has reference images but no reference-upload selector was captured — skipping.",
          ctx,
        );
      } else {
        const uploadEl = document.querySelector(selectors.referenceUpload);
        if (!uploadEl) {
          log.warning(
            `Reference upload element not found using selector "${selectors.referenceUpload}" — skipping.`,
            ctx,
          );
        } else if (
          setElementFiles(
            uploadEl,
            referenceImages.map((image) =>
              base64ToFile(image.fileName, image.mimeType, image.dataBase64),
            ),
          )
        ) {
          log.info(`Attached ${String(referenceImages.length)} reference image(s).`, ctx);
        } else {
          log.warning(
            "Reference upload element isn't a real file input — can't attach images to it programmatically.",
            ctx,
          );
        }
      }
    }

    const generateEl = document.querySelector(selectors.generateButton);
    if (!generateEl || !(generateEl instanceof HTMLElement)) {
      log.error(`Generate button not found using selector "${selectors.generateButton}".`, ctx);
      throw new Error(
        "Generate button element wasn't found on the page — re-capture it in Developer Mode.",
      );
    }
    log.info(`Generate button found: <${generateEl.tagName.toLowerCase()}>.`, ctx);

    if (!isClickable(generateEl)) {
      log.error("Generate button is disabled or hidden — refusing to click it.", ctx);
      throw new Error(
        "The Generate button is disabled or not visible right now, so it wasn't clicked. Check the page state, or re-capture the button if this selector is stale.",
      );
    }
    generateEl.click();
    log.info("Generate button clicked.", ctx);

    if (clickDownload && selectors.downloadButton) {
      log.info("Waiting for the download button to become available…", ctx);
      const downloadEl = await waitForClickable(selectors.downloadButton, maxWaitMs);
      if (!downloadEl) {
        log.error(
          `Timed out after ${String(maxWaitMs)}ms waiting for the download button to become clickable — generation may not have started.`,
          ctx,
        );
        throw new Error(
          "Timed out waiting for the download button to become available — this usually means Generate didn't actually start generating (check the captured selectors and the page).",
        );
      }
      downloadEl.click();
      log.info("Download button clicked.", ctx);
      await sleep(500);
    } else {
      log.info(
        `Auto-download is off — waiting ${String(maxWaitMs)}ms as a best-effort completion delay (no reliable generic signal for "generation finished" without a download button).`,
        ctx,
      );
      await sleep(maxWaitMs);
    }

    log.info("Automation run completed successfully.", ctx);
    reportAutomationResult(requestId, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Automation failed.";
    log.error(`Automation run failed: ${message}`, ctx);
    reportAutomationResult(requestId, false, message);
  }
}
