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

  function emitDisconnect(): void {
    disconnectListeners.forEach((listener) => {
      listener();
    });
  }

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
    disconnect: emitDisconnect,
    emitMessage: (message) => {
      messageListeners.forEach((listener) => {
        listener(message);
      });
    },
    emitDisconnect,
  };
}

/**
 * Two fake ports wired together so postMessage on one delivers
 * asynchronously (matching real chrome.runtime.Port) to the other's
 * onMessage listeners — for end-to-end protocol tests. Disconnecting
 * either side fires onDisconnect on both, matching real Chrome behavior.
 */
export function createFakePortPair(): [PortLike, PortLike] {
  const messageListenersA = new Set<(message: unknown) => void>();
  const messageListenersB = new Set<(message: unknown) => void>();
  const disconnectListenersA = new Set<() => void>();
  const disconnectListenersB = new Set<() => void>();

  function disconnectBoth(): void {
    disconnectListenersA.forEach((listener) => {
      listener();
    });
    disconnectListenersB.forEach((listener) => {
      listener();
    });
  }

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
    disconnect: disconnectBoth,
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
    disconnect: disconnectBoth,
  };

  return [portA, portB];
}
