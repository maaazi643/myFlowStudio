import { createQueueRunsRepository } from "@shared/storage/indexedDb/repositories";
import { createMessageRouter } from "./messaging/router";
import { attachRouterToRuntime } from "./messaging/attachRouterToRuntime";
import { registerPingHandler } from "./messaging/handlers/ping";
import { startHeartbeat } from "./lifecycle/keepAlive";
import { QueueEngine } from "./queue/queueEngine";
import { registerQueueHandlers } from "./queue/handlers";
import { createSimulatedAutomationExecutor } from "./automation/simulatedExecutor";
import { createCaptureController } from "./devMode/captureController";
import { createChromeTabsBridge } from "./devMode/tabsBridge";
import { registerDevModeHandlers } from "./devMode/handlers";
import { attachContentBridgeToRuntime } from "./devMode/attachContentBridge";

const router = createMessageRouter();
registerPingHandler(router);
attachRouterToRuntime(router);
startHeartbeat(router);

const captureController = createCaptureController({ router, tabs: createChromeTabsBridge() });
registerDevModeHandlers(router, captureController);
attachContentBridgeToRuntime(captureController);

const queueEngine = new QueueEngine({
  repo: createQueueRunsRepository(),
  // Placeholder until M6 unblocks — see shared/automation/executor.ts.
  executor: createSimulatedAutomationExecutor(),
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
