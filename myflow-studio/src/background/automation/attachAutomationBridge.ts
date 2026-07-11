import type { AutomationBridge } from "./automationBridge";

/** The one call in this module that touches the real chrome API — everything else is pure/testable. */
export function attachAutomationBridgeToRuntime(bridge: AutomationBridge): void {
  chrome.runtime.onMessage.addListener((message) => {
    bridge.handleMessage(message);
  });
}
