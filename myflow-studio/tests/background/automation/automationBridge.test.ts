import { describe, expect, it } from "vitest";
import { createAutomationBridge } from "@background/automation/automationBridge";

describe("createAutomationBridge", () => {
  it("resolves waitFor once a matching completion event arrives", async () => {
    const bridge = createAutomationBridge();
    const promise = bridge.waitFor("req-1");

    bridge.handleMessage({ type: "MYFLOW_AUTOMATION_COMPLETE", requestId: "req-1", ok: true });

    await expect(promise).resolves.toEqual({
      type: "MYFLOW_AUTOMATION_COMPLETE",
      requestId: "req-1",
      ok: true,
    });
  });

  it("ignores completion events for a different requestId", async () => {
    const bridge = createAutomationBridge();
    const promise = bridge.waitFor("req-1");
    let resolved = false;
    void promise.then(() => {
      resolved = true;
    });

    bridge.handleMessage({ type: "MYFLOW_AUTOMATION_COMPLETE", requestId: "req-2", ok: true });
    await Promise.resolve();

    expect(resolved).toBe(false);
  });

  it("ignores messages that aren't automation-complete events", async () => {
    const bridge = createAutomationBridge();
    const promise = bridge.waitFor("req-1");
    let resolved = false;
    void promise.then(() => {
      resolved = true;
    });

    bridge.handleMessage({ type: "MYFLOW_CAPTURE_RESULT" });
    bridge.handleMessage(null);
    await Promise.resolve();

    expect(resolved).toBe(false);
  });

  it("delivers a failure event with its error message", async () => {
    const bridge = createAutomationBridge();
    const promise = bridge.waitFor("req-1");

    bridge.handleMessage({
      type: "MYFLOW_AUTOMATION_COMPLETE",
      requestId: "req-1",
      ok: false,
      error: "Timed out.",
    });

    await expect(promise).resolves.toMatchObject({ ok: false, error: "Timed out." });
  });

  it("only resolves a given requestId once", async () => {
    const bridge = createAutomationBridge();
    const promise = bridge.waitFor("req-1");
    bridge.handleMessage({ type: "MYFLOW_AUTOMATION_COMPLETE", requestId: "req-1", ok: true });
    await promise;

    // A second event for the same id should not throw or affect anything (no pending waiter left).
    expect(() => {
      bridge.handleMessage({ type: "MYFLOW_AUTOMATION_COMPLETE", requestId: "req-1", ok: true });
    }).not.toThrow();
  });
});
