import { useEffect, useState } from "react";
import { connectToBackground } from "@shared/messaging/connect";
import type { CapturableElementRole } from "@shared/devtools/roles";

export interface UseDevCaptureResult {
  /** The role currently waiting for a click on the page, or null when idle. */
  activeRole: CapturableElementRole | null;
  starting: boolean;
  error: string | null;
  start: (role: CapturableElementRole) => Promise<void>;
  cancel: () => void;
}

export function useDevCapture(): UseDevCaptureResult {
  const [client] = useState(() => connectToBackground("devMode"));
  const [activeRole, setActiveRole] = useState<CapturableElementRole | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = client.onEvent((event) => {
      if (event.type === "DEV_CAPTURE_COMPLETE" || event.type === "DEV_CAPTURE_CANCELLED") {
        setActiveRole(null);
      }
    });
    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [client]);

  async function start(role: CapturableElementRole): Promise<void> {
    setStarting(true);
    setError(null);
    try {
      await client.request({ type: "DEV_CAPTURE_START", role });
      setActiveRole(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start capture.");
    } finally {
      setStarting(false);
    }
  }

  function cancel(): void {
    setActiveRole(null);
    void client.request({ type: "DEV_CAPTURE_CANCEL" });
  }

  return { activeRole, starting, error, start, cancel };
}
