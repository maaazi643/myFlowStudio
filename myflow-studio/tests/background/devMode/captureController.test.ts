import { describe, expect, it } from "vitest";
import { createMessageRouter } from "@background/messaging/router";
import { createCaptureController } from "@background/devMode/captureController";
import { selectorRegistryStorageKey } from "@shared/storage/selectorRegistryStorage";
import { getValue } from "@shared/storage/chromeStorage";
import { createFakePort } from "../../mocks/fakePort";
import { createFakeTabs } from "../../mocks/fakeTabs";
import { createFakeStorageArea } from "../../mocks/fakeStorageArea";

describe("captureController.startCapture", () => {
  it("sends a start-picking command to the active tab and returns its info", async () => {
    const router = createMessageRouter();
    const tabs = createFakeTabs({ activeTab: { id: 7, title: "Google Flow" } });
    const controller = createCaptureController({ router, tabs, area: createFakeStorageArea() });

    const result = await controller.startCapture("promptBox");

    expect(result).toEqual({ tabId: 7, tabTitle: "Google Flow" });
    expect(tabs.sentMessages).toEqual([
      { tabId: 7, message: { type: "MYFLOW_START_PICKING", role: "promptBox" } },
    ]);
  });

  it("throws a clear error when there's no active tab", async () => {
    const router = createMessageRouter();
    const tabs = createFakeTabs({ activeTab: undefined });
    const controller = createCaptureController({ router, tabs, area: createFakeStorageArea() });

    await expect(controller.startCapture("promptBox")).rejects.toThrow(/No active tab/);
  });

  it("throws a clear error when the content script doesn't respond", async () => {
    const router = createMessageRouter();
    const tabs = createFakeTabs({ activeTab: { id: 9 }, unreachableTabId: 9 });
    const controller = createCaptureController({ router, tabs, area: createFakeStorageArea() });

    await expect(controller.startCapture("promptBox")).rejects.toThrow(/Couldn't reach the page/);
  });
});

describe("captureController.cancelCapture", () => {
  it("does nothing when no capture is active", async () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);
    const tabs = createFakeTabs({ activeTab: { id: 1 } });
    const controller = createCaptureController({ router, tabs, area: createFakeStorageArea() });

    await controller.cancelCapture();

    expect(port.sent).toEqual([]);
  });

  it("stops picking on the active tab and broadcasts DEV_CAPTURE_CANCELLED", async () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);
    const tabs = createFakeTabs({ activeTab: { id: 3 } });
    const controller = createCaptureController({ router, tabs, area: createFakeStorageArea() });

    await controller.startCapture("generateButton");
    await controller.cancelCapture();

    expect(tabs.sentMessages).toContainEqual({
      tabId: 3,
      message: { type: "MYFLOW_STOP_PICKING" },
    });
    expect(port.sent).toEqual([
      { kind: "event", event: { type: "DEV_CAPTURE_CANCELLED", role: "generateButton" } },
    ]);
  });

  it("still clears state and broadcasts even if the tab has navigated away", async () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);
    let started = false;
    const tabs = {
      queryActiveTab: () => Promise.resolve({ id: 5 }),
      sendMessage: () => {
        if (!started) {
          started = true;
          return Promise.resolve(undefined);
        }
        return Promise.reject(new Error("Tab was closed."));
      },
    };
    const controller = createCaptureController({ router, tabs, area: createFakeStorageArea() });
    await controller.startCapture("promptBox");

    await expect(controller.cancelCapture()).resolves.toBeUndefined();
    expect(port.sent).toEqual([
      { kind: "event", event: { type: "DEV_CAPTURE_CANCELLED", role: "promptBox" } },
    ]);
  });
});

describe("captureController.handleContentMessage", () => {
  it("ignores messages that aren't recognized content events", () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);
    const controller = createCaptureController({
      router,
      tabs: createFakeTabs(),
      area: createFakeStorageArea(),
    });

    controller.handleContentMessage({ type: "SOME_OTHER_MESSAGE" });
    controller.handleContentMessage(null);

    expect(port.sent).toEqual([]);
  });

  it("stores a capture result in the registry and broadcasts DEV_CAPTURE_COMPLETE", async () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);
    const area = createFakeStorageArea();
    const controller = createCaptureController({ router, tabs: createFakeTabs(), area });

    controller.handleContentMessage({
      type: "MYFLOW_CAPTURE_RESULT",
      role: "promptBox",
      selector: "#prompt",
      confidence: "high",
      reason: "id attribute",
      tagName: "textarea",
      pageUrl: "https://labs.google/fx/tools/flow",
    });
    await Promise.resolve();
    await Promise.resolve();

    const registry = await getValue(selectorRegistryStorageKey, area);
    expect(registry.promptBox).toMatchObject({ role: "promptBox", selector: "#prompt" });
    expect(port.sent).toHaveLength(1);
    expect((port.sent[0] as { event: { type: string } }).event.type).toBe("DEV_CAPTURE_COMPLETE");
  });

  it("preserves previously captured roles when storing a new one", async () => {
    const router = createMessageRouter();
    const area = createFakeStorageArea();
    const controller = createCaptureController({ router, tabs: createFakeTabs(), area });

    controller.handleContentMessage({
      type: "MYFLOW_CAPTURE_RESULT",
      role: "promptBox",
      selector: "#prompt",
      confidence: "high",
      reason: "id attribute",
      tagName: "textarea",
      pageUrl: "https://labs.google/fx/tools/flow",
    });
    await Promise.resolve();
    await Promise.resolve();

    controller.handleContentMessage({
      type: "MYFLOW_CAPTURE_RESULT",
      role: "generateButton",
      selector: "#generate",
      confidence: "high",
      reason: "id attribute",
      tagName: "button",
      pageUrl: "https://labs.google/fx/tools/flow",
    });
    await Promise.resolve();
    await Promise.resolve();

    const registry = await getValue(selectorRegistryStorageKey, area);
    expect(registry.promptBox?.selector).toBe("#prompt");
    expect(registry.generateButton?.selector).toBe("#generate");
  });

  it("broadcasts DEV_CAPTURE_CANCELLED for a cancellation event from the content script", async () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);
    const controller = createCaptureController({
      router,
      tabs: createFakeTabs(),
      area: createFakeStorageArea(),
    });

    controller.handleContentMessage({ type: "MYFLOW_CAPTURE_CANCELLED", role: "downloadButton" });
    await Promise.resolve();

    expect(port.sent).toEqual([
      { kind: "event", event: { type: "DEV_CAPTURE_CANCELLED", role: "downloadButton" } },
    ]);
  });
});
