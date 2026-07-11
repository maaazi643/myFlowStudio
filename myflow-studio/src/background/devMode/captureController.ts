import type { CapturableElementRole } from "@shared/devtools/roles";
import type { CapturedSelector } from "@shared/devtools/registry";
import { isContentEvent } from "@shared/devtools/contentProtocol";
import type { ContentEvent } from "@shared/devtools/contentProtocol";
import { getValue, setValue } from "@shared/storage/chromeStorage";
import type { StorageArea } from "@shared/storage/chromeStorage";
import { selectorRegistryStorageKey } from "@shared/storage/selectorRegistryStorage";
import type { MessageRouter } from "../messaging/router";
import type { TabsLike } from "./tabsBridge";

export interface StartCaptureResult {
  tabId: number;
  tabTitle: string;
}

export interface CaptureController {
  startCapture(role: CapturableElementRole): Promise<StartCaptureResult>;
  cancelCapture(): Promise<void>;
  /** Wired to chrome.runtime.onMessage — ignores anything that isn't a recognized content event. */
  handleContentMessage(message: unknown): void;
}

export interface CaptureControllerDeps {
  router: MessageRouter;
  tabs: TabsLike;
  area?: StorageArea;
}

export function createCaptureController(deps: CaptureControllerDeps): CaptureController {
  const { router, tabs, area } = deps;
  let active: { role: CapturableElementRole; tabId: number } | null = null;

  async function startCapture(role: CapturableElementRole): Promise<StartCaptureResult> {
    const tab = await tabs.queryActiveTab();
    if (!tab) {
      throw new Error(
        "No active tab found. Open the Google Flow tab, make sure it's focused, then try again.",
      );
    }
    try {
      await tabs.sendMessage(tab.id, { type: "MYFLOW_START_PICKING", role });
    } catch {
      throw new Error(
        "Couldn't reach the page. Make sure the active tab is on Google Flow and fully loaded, then try again.",
      );
    }
    active = { role, tabId: tab.id };
    return { tabId: tab.id, tabTitle: tab.title ?? "" };
  }

  async function cancelCapture(): Promise<void> {
    if (!active) {
      return;
    }
    const { role, tabId } = active;
    active = null;
    try {
      await tabs.sendMessage(tabId, { type: "MYFLOW_STOP_PICKING" });
    } catch {
      // Tab may have navigated away or closed — nothing left to clean up there.
    }
    router.broadcast({ type: "DEV_CAPTURE_CANCELLED", role });
  }

  async function handleEvent(event: ContentEvent): Promise<void> {
    if (active?.role === event.role) {
      active = null;
    }

    if (event.type === "MYFLOW_CAPTURE_CANCELLED") {
      router.broadcast({ type: "DEV_CAPTURE_CANCELLED", role: event.role });
      return;
    }

    const captured: CapturedSelector = {
      role: event.role,
      selector: event.selector,
      confidence: event.confidence,
      reason: event.reason,
      tagName: event.tagName,
      warning: event.warning,
      pageUrl: event.pageUrl,
      capturedAt: Date.now(),
    };
    const registry = await getValue(selectorRegistryStorageKey, area);
    await setValue(selectorRegistryStorageKey, { ...registry, [event.role]: captured }, area);
    router.broadcast({ type: "DEV_CAPTURE_COMPLETE", captured });
  }

  function handleContentMessage(message: unknown): void {
    if (!isContentEvent(message)) {
      return;
    }
    void handleEvent(message);
  }

  return { startCapture, cancelCapture, handleContentMessage };
}
