import { isDiscoveryStatusMessage } from "@shared/automation/contentAutomationProtocol";
import { automationStatusStorageKey } from "@shared/storage/automationStatusStorage";
import { setValue } from "@shared/storage/chromeStorage";
import type { StorageArea } from "@shared/storage/chromeStorage";

/**
 * Relays the content script's discovery findings into chrome.storage, so
 * the side panel's live AutomationStatusBanner (via useStorageValue)
 * reflects the current page with no broadcast/router plumbing needed.
 */
export function attachDiscoveryStatusBridgeToRuntime(area?: StorageArea): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (!isDiscoveryStatusMessage(message)) {
      return;
    }
    void setValue(automationStatusStorageKey, message.status, area);
  });
}
