/**
 * Background <-> content-script channel for driving one generation on the
 * real Google Flow page, using only the selectors Developer Mode already
 * captured — never anything hardcoded. Deliberately does not touch the
 * model/aspect-ratio/quality selectors: knowing *which element* opens a
 * dropdown doesn't tell us which option inside it corresponds to the
 * user's chosen value, and guessing that mapping is exactly the kind of
 * guess this project has been told not to make. Those three selectors are
 * captured and stored for a future milestone (per-option capture); this
 * automation runner only fills the prompt, optionally attaches reference
 * images, clicks Generate, and optionally clicks Download.
 */

export interface AutomationReferenceImage {
  fileName: string;
  mimeType: string;
  dataBase64: string;
}

export interface AutomationSelectors {
  promptBox: string;
  generateButton: string;
  downloadButton?: string | undefined;
  referenceUpload?: string | undefined;
}

export interface RunAutomationCommand {
  type: "MYFLOW_RUN_AUTOMATION";
  requestId: string;
  promptText: string;
  referenceImages: AutomationReferenceImage[];
  selectors: AutomationSelectors;
  /** Whether to click the download button once generation finishes (mirrors GenerationSettings.autoDownload). */
  clickDownload: boolean;
  /** How long to wait for generation to finish before giving up. */
  maxWaitMs: number;
}

export function isRunAutomationCommand(value: unknown): value is RunAutomationCommand {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "MYFLOW_RUN_AUTOMATION"
  );
}

export interface AutomationCompleteEvent {
  type: "MYFLOW_AUTOMATION_COMPLETE";
  requestId: string;
  ok: boolean;
  error?: string | undefined;
}

export function isAutomationCompleteEvent(value: unknown): value is AutomationCompleteEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "MYFLOW_AUTOMATION_COMPLETE"
  );
}
