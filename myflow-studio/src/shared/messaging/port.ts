/**
 * The subset of chrome.runtime.Port the messaging bus actually uses.
 * Narrowing to our own interface — rather than typing everything against
 * the full ambient `chrome` global — means tests can supply a plain
 * in-memory fake instead of mocking Chrome APIs. A real chrome.runtime.Port
 * satisfies this structurally, no adapter needed.
 */
export interface PortLike {
  postMessage(message: unknown): void;
  onMessage: { addListener(listener: (message: unknown) => void): void };
  onDisconnect: { addListener(listener: () => void): void };
}
