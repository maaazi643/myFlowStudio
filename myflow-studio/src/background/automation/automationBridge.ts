import { isAutomationCompleteEvent } from "@shared/automation/contentAutomationProtocol";
import type { AutomationCompleteEvent } from "@shared/automation/contentAutomationProtocol";

/**
 * Correlates a MYFLOW_RUN_AUTOMATION command sent to a tab with the
 * MYFLOW_AUTOMATION_COMPLETE event that tab's content script eventually
 * sends back via chrome.runtime.onMessage — the tabs.sendMessage call
 * itself doesn't carry that reply, since the content script only resolves
 * it once generation actually finishes.
 */
export interface AutomationBridge {
  waitFor(requestId: string): Promise<AutomationCompleteEvent>;
  handleMessage(message: unknown): void;
}

export function createAutomationBridge(): AutomationBridge {
  const pending = new Map<string, (event: AutomationCompleteEvent) => void>();

  return {
    waitFor(requestId) {
      return new Promise((resolve) => {
        pending.set(requestId, resolve);
      });
    },
    handleMessage(message) {
      if (!isAutomationCompleteEvent(message)) {
        return;
      }
      const resolve = pending.get(message.requestId);
      if (!resolve) {
        return;
      }
      pending.delete(message.requestId);
      resolve(message);
    },
  };
}
