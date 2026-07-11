import { describe, expect, it } from "vitest";
import { isLogMessage } from "@shared/logging/logProtocol";

describe("isLogMessage", () => {
  it("accepts a well-formed log message", () => {
    expect(isLogMessage({ type: "MYFLOW_LOG", level: "info", message: "hello" })).toBe(true);
  });

  it("accepts one with context", () => {
    expect(
      isLogMessage({
        type: "MYFLOW_LOG",
        level: "error",
        message: "x",
        context: { role: "promptBox" },
      }),
    ).toBe(true);
  });

  it("rejects unrelated messages", () => {
    expect(isLogMessage({ type: "MYFLOW_CAPTURE_RESULT" })).toBe(false);
    expect(isLogMessage(null)).toBe(false);
    expect(isLogMessage("x")).toBe(false);
    expect(isLogMessage(undefined)).toBe(false);
  });
});
