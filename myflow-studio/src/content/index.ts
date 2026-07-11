import { isRunAutomationCommand } from "@shared/automation/contentAutomationProtocol";
import type { DiscoveryStatusMessage } from "@shared/automation/contentAutomationProtocol";
import type { AutomationStatus } from "@shared/automation/discoveryStatus";
import { createDiscoveryEngine } from "./discovery/engine";
import { runAutomation } from "./automationRunner";
import { log } from "./logging";

log.info(`Content script ready on ${window.location.href}.`);

function reportStatus(status: AutomationStatus): void {
  const message: DiscoveryStatusMessage = { type: "MYFLOW_DISCOVERY_STATUS", status };
  chrome.runtime.sendMessage(message).catch(() => undefined);
}

const engine = createDiscoveryEngine(reportStatus);
engine.start();

chrome.runtime.onMessage.addListener((message) => {
  if (isRunAutomationCommand(message)) {
    void runAutomation(message, engine);
  }
});
