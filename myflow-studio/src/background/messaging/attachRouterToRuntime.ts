import type { MessageRouter } from "./router";

/** The one call in this module that touches the real chrome API — everything else is pure. */
export function attachRouterToRuntime(router: MessageRouter): void {
  chrome.runtime.onConnect.addListener((port) => {
    router.attachPort(port);
  });
}
