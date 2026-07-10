import { createMessagingClient } from "./client";
import type { MessagingClient } from "./client";

/** Opens a real port to the background service worker. */
export function connectToBackground(portName: string): MessagingClient {
  const port = chrome.runtime.connect({ name: portName });
  return createMessagingClient(port);
}
