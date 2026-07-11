import { isContentCommand } from "@shared/devtools/contentProtocol";
import { isRunAutomationCommand } from "@shared/automation/contentAutomationProtocol";
import { startPicking, stopPicking } from "./picker";
import { runAutomation } from "./automationRunner";
import { log } from "./logging";

log.info(`Content script ready on ${window.location.href}.`);

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
