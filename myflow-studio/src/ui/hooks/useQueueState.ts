import { useEffect, useState } from "react";
import { connectToBackground } from "@shared/messaging/connect";
import type { QueueRun } from "@shared/types/queue";

export interface UseQueueStateResult {
  run: QueueRun | null;
  error: string | null;
  starting: boolean;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipCurrent: () => void;
  retryItem: (itemId: string) => void;
  retryAllFailed: () => void;
  retrySelected: (itemIds: string[]) => void;
}

export function useQueueState(): UseQueueStateResult {
  // Lazy useState initializer — guaranteed to run exactly once per mount,
  // unlike a useRef initializer (which re-evaluates its argument every
  // render) or useMemo (not guaranteed once). Opening a port is a real
  // side effect, so it can't run more than once here.
  const [client] = useState(() => connectToBackground("queue"));
  const [run, setRun] = useState<QueueRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const unsubscribe = client.onEvent((event) => {
      if (event.type === "QUEUE_PROGRESS") {
        setRun(event.run);
      }
    });
    client
      .request<QueueRun | null>({ type: "QUEUE_GET_STATE" })
      .then((state) => {
        setRun(state);
      })
      .catch(() => {
        // No active run yet — nothing to show, not an error worth surfacing.
      });
    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [client]);

  async function start(): Promise<void> {
    setStarting(true);
    setError(null);
    try {
      const state = await client.request<QueueRun>({ type: "QUEUE_START" });
      setRun(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the queue.");
    } finally {
      setStarting(false);
    }
  }

  function pause(): void {
    void client.request({ type: "QUEUE_PAUSE" });
  }

  function resume(): void {
    void client.request({ type: "QUEUE_RESUME" });
  }

  function stop(): void {
    void client.request({ type: "QUEUE_STOP" });
  }

  function skipCurrent(): void {
    void client.request({ type: "QUEUE_SKIP_CURRENT" });
  }

  function retryItem(itemId: string): void {
    void client.request({ type: "QUEUE_RETRY_ITEM", itemId });
  }

  function retryAllFailed(): void {
    void client.request({ type: "QUEUE_RETRY_ALL_FAILED" });
  }

  function retrySelected(itemIds: string[]): void {
    void client.request({ type: "QUEUE_RETRY_SELECTED", itemIds });
  }

  return {
    run,
    error,
    starting,
    start,
    pause,
    resume,
    stop,
    skipCurrent,
    retryItem,
    retryAllFailed,
    retrySelected,
  };
}
