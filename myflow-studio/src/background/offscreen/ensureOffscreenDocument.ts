const OFFSCREEN_DOCUMENT_PATH = "src/offscreen/index.html";

let creating: Promise<void> | null = null;

/**
 * Lazily creates the offscreen document on first use rather than at
 * startup — nothing needs it until a real caller does (the download
 * pipeline's blob conversion, M8). Safe to call repeatedly; concurrent
 * callers share one in-flight creation instead of racing
 * chrome.offscreen.createDocument, which throws if called twice.
 */
export async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
  });
  if (existingContexts.length > 0) {
    return;
  }

  creating ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.BLOBS],
      justification:
        "Converts generated and reference image blobs into downloadable files — the service worker has no DOM to do this itself.",
    })
    .finally(() => {
      creating = null;
    });
  await creating;
}
