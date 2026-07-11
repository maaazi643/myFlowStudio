import { describe, expect, it } from "vitest";
import { isContentCommand, isContentEvent } from "@shared/devtools/contentProtocol";

describe("isContentCommand", () => {
  it("accepts a start-picking command", () => {
    expect(isContentCommand({ type: "MYFLOW_START_PICKING", role: "promptBox" })).toBe(true);
  });

  it("accepts a stop-picking command", () => {
    expect(isContentCommand({ type: "MYFLOW_STOP_PICKING" })).toBe(true);
  });

  it("rejects unrelated messages", () => {
    expect(isContentCommand({ type: "SOME_OTHER_EXTENSION_MESSAGE" })).toBe(false);
    expect(isContentCommand(null)).toBe(false);
    expect(isContentCommand("a string")).toBe(false);
    expect(isContentCommand(undefined)).toBe(false);
  });
});

describe("isContentEvent", () => {
  it("accepts a capture-result event", () => {
    expect(
      isContentEvent({
        type: "MYFLOW_CAPTURE_RESULT",
        role: "promptBox",
        selector: "#x",
        confidence: "high",
        reason: "id attribute",
        tagName: "textarea",
        pageUrl: "https://labs.google/fx/tools/flow",
      }),
    ).toBe(true);
  });

  it("accepts a capture-cancelled event", () => {
    expect(isContentEvent({ type: "MYFLOW_CAPTURE_CANCELLED", role: "promptBox" })).toBe(true);
  });

  it("rejects unrelated messages", () => {
    expect(isContentEvent({ type: "MYFLOW_START_PICKING", role: "promptBox" })).toBe(false);
    expect(isContentEvent(null)).toBe(false);
    expect(isContentEvent(42)).toBe(false);
  });
});
