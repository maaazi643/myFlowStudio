import { describe, expect, it } from "vitest";
import {
  isAutomationCompleteEvent,
  isRunAutomationCommand,
} from "@shared/automation/contentAutomationProtocol";

describe("isRunAutomationCommand", () => {
  it("accepts a well-formed command", () => {
    expect(
      isRunAutomationCommand({
        type: "MYFLOW_RUN_AUTOMATION",
        requestId: "abc",
        promptText: "a fox",
        referenceImages: [],
        selectors: { promptBox: "#p", generateButton: "#g" },
        clickDownload: false,
        maxWaitMs: 1000,
      }),
    ).toBe(true);
  });

  it("rejects unrelated messages", () => {
    expect(isRunAutomationCommand({ type: "MYFLOW_START_PICKING" })).toBe(false);
    expect(isRunAutomationCommand(null)).toBe(false);
    expect(isRunAutomationCommand("x")).toBe(false);
  });
});

describe("isAutomationCompleteEvent", () => {
  it("accepts a success event", () => {
    expect(
      isAutomationCompleteEvent({ type: "MYFLOW_AUTOMATION_COMPLETE", requestId: "x", ok: true }),
    ).toBe(true);
  });

  it("accepts a failure event", () => {
    expect(
      isAutomationCompleteEvent({
        type: "MYFLOW_AUTOMATION_COMPLETE",
        requestId: "x",
        ok: false,
        error: "nope",
      }),
    ).toBe(true);
  });

  it("rejects unrelated messages", () => {
    expect(isAutomationCompleteEvent({ type: "MYFLOW_CAPTURE_RESULT" })).toBe(false);
    expect(isAutomationCompleteEvent(undefined)).toBe(false);
  });
});
