import {
  createImagesRepository,
  createQueueRunsRepository,
} from "@shared/storage/indexedDb/repositories";
import { createMessageRouter } from "./messaging/router";
import { attachRouterToRuntime } from "./messaging/attachRouterToRuntime";
import { registerPingHandler } from "./messaging/handlers/ping";
import { startHeartbeat } from "./lifecycle/keepAlive";
import { QueueEngine } from "./queue/queueEngine";
import { registerQueueHandlers } from "./queue/handlers";
import { createSimulatedAutomationExecutor } from "./automation/simulatedExecutor";
import { createRealAutomationExecutor } from "./automation/realExecutor";
import { createSelectingAutomationExecutor } from "./automation/selectingExecutor";
import { createAutomationBridge } from "./automation/automationBridge";
import { attachAutomationBridgeToRuntime } from "./automation/attachAutomationBridge";
import { createCaptureController } from "./devMode/captureController";
import { createChromeTabsBridge } from "./devMode/tabsBridge";
import { registerDevModeHandlers } from "./devMode/handlers";
import { attachContentBridgeToRuntime } from "./devMode/attachContentBridge";
import { createDownloadRenamer } from "./downloads/downloadNaming";
import { createChromeDownloadsBridge } from "./downloads/chromeDownloadsBridge";

const router = createMessageRouter();
registerPingHandler(router);
attachRouterToRuntime(router);
startHeartbeat(router);

const tabsBridge = createChromeTabsBridge();

const captureController = createCaptureController({ router, tabs: tabsBridge });
registerDevModeHandlers(router, captureController);
attachContentBridgeToRuntime(captureController);

const automationBridge = createAutomationBridge();
attachAutomationBridgeToRuntime(automationBridge);

const queueEngine = new QueueEngine({
  repo: createQueueRunsRepository(),
  // Automatically upgrades from the simulated executor to the real one the
  // moment Developer Mode's required selectors are all captured.
  executor: createSelectingAutomationExecutor({
    real: createRealAutomationExecutor({
      tabs: tabsBridge,
      imagesRepo: createImagesRepository(),
      bridge: automationBridge,
      renamer: createDownloadRenamer(createChromeDownloadsBridge()),
    }),
    simulated: createSimulatedAutomationExecutor(),
  }),
  broadcast: (event) => {
    router.broadcast(event);
  },
});
registerQueueHandlers(router, queueEngine);
// Runs on every service worker (re)start, not just install — this is the
// actual "resume after restart" moment for an in-progress run.
void queueEngine.initialize();

chrome.runtime.onInstalled.addListener((details) => {
  console.info("[MyFlow Studio] installed", details.reason);
});
