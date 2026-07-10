import { createMessageRouter } from "./messaging/router";
import { attachRouterToRuntime } from "./messaging/attachRouterToRuntime";
import { registerPingHandler } from "./messaging/handlers/ping";
import { startHeartbeat } from "./lifecycle/keepAlive";

const router = createMessageRouter();
registerPingHandler(router);
attachRouterToRuntime(router);
startHeartbeat(router);

chrome.runtime.onInstalled.addListener((details) => {
  console.info("[MyFlow Studio] installed", details.reason);
});
