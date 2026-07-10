import type { PortLike } from "@shared/messaging/port";

/** A single fake port with manual control — for testing one side in isolation. */
export function createFakePort(): PortLike & {
  emitMessage: (message: unknown) => void;
  emitDisconnect: () => void;
  sent: unknown[];
} {
  const messageListeners = new Set<(message: unknown) => void>();
  const disconnectListeners = new Set<() => void>();
  const sent: unknown[] = [];

  return {
    sent,
    postMessage: (message) => {
      sent.push(message);
    },
    onMessage: {
      addListener: (listener) => {
        messageListeners.add(listener);
      },
    },
    onDisconnect: {
      addListener: (listener) => {
        disconnectListeners.add(listener);
      },
    },
    emitMessage: (message) => {
      messageListeners.forEach((listener) => {
        listener(message);
      });
    },
    emitDisconnect: () => {
      disconnectListeners.forEach((listener) => {
        listener();
      });
    },
  };
}

/**
 * Two fake ports wired together so postMessage on one delivers
 * asynchronously (matching real chrome.runtime.Port) to the other's
 * onMessage listeners — for end-to-end protocol tests.
 */
export function createFakePortPair(): [PortLike, PortLike] {
  const messageListenersA = new Set<(message: unknown) => void>();
  const messageListenersB = new Set<(message: unknown) => void>();
  const disconnectListenersA = new Set<() => void>();
  const disconnectListenersB = new Set<() => void>();

  const portA: PortLike = {
    postMessage: (message) => {
      queueMicrotask(() => {
        messageListenersB.forEach((listener) => {
          listener(message);
        });
      });
    },
    onMessage: {
      addListener: (listener) => {
        messageListenersA.add(listener);
      },
    },
    onDisconnect: {
      addListener: (listener) => {
        disconnectListenersA.add(listener);
      },
    },
  };

  const portB: PortLike = {
    postMessage: (message) => {
      queueMicrotask(() => {
        messageListenersA.forEach((listener) => {
          listener(message);
        });
      });
    },
    onMessage: {
      addListener: (listener) => {
        messageListenersB.add(listener);
      },
    },
    onDisconnect: {
      addListener: (listener) => {
        disconnectListenersB.add(listener);
      },
    },
  };

  return [portA, portB];
}
