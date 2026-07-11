import { describe, expect, it, vi } from "vitest";
import { createRealAutomationExecutor } from "@background/automation/realExecutor";
import { createAutomationBridge } from "@background/automation/automationBridge";
import { setValue } from "@shared/storage/chromeStorage";
import { selectorRegistryStorageKey } from "@shared/storage/selectorRegistryStorage";
import type { CapturedSelector, SelectorRegistry } from "@shared/devtools/registry";
import type { StoredImage } from "@shared/types/image";
import type { GenerationSettings } from "@shared/types/generationSettings";
import { DEFAULT_GENERATION_SETTINGS } from "@shared/storage/generationSettingsStorage";
import { createFakeTabs } from "../../mocks/fakeTabs";
import { createFakeStorageArea } from "../../mocks/fakeStorageArea";
import { createNoopLogger } from "../../mocks/noopLogger";
import type { DownloadRenamer } from "@background/downloads/downloadNaming";

function makeCaptured(role: CapturedSelector["role"], selector: string): CapturedSelector {
  return {
    role,
    selector,
    confidence: "high",
    reason: "id attribute",
    tagName: "div",
    pageUrl: "https://labs.google/fx/tools/flow",
    capturedAt: Date.now(),
  };
}

function completeRegistry(): SelectorRegistry {
  return {
    promptBox: makeCaptured("promptBox", "#prompt"),
    generateButton: makeCaptured("generateButton", "#generate"),
    downloadButton: makeCaptured("downloadButton", "#download"),
  };
}

const settings: GenerationSettings = { ...DEFAULT_GENERATION_SETTINGS, autoDownload: true };

function makeRenamer(): DownloadRenamer & { expectedNames: string[] } {
  const expectedNames: string[] = [];
  return {
    expectedNames,
    expectNextDownloadAs: (filename) => {
      expectedNames.push(filename);
    },
  };
}

describe("createRealAutomationExecutor", () => {
  it("fails with a clear error when the selector registry is incomplete", async () => {
    const area = createFakeStorageArea();
    const executor = createRealAutomationExecutor({
      tabs: createFakeTabs({ activeTab: { id: 1 } }),
      imagesRepo: { getById: () => Promise.resolve(undefined) },
      bridge: createAutomationBridge(),
      renamer: makeRenamer(),
      logger: createNoopLogger(),
      area,
    });

    const result = await executor.generate({ promptText: "a fox", imageIndex: 0, settings });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Developer Mode setup isn't complete/);
  });

  it("fails with a clear error when there's no active tab", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, completeRegistry(), area);
    const executor = createRealAutomationExecutor({
      tabs: createFakeTabs({ activeTab: undefined }),
      imagesRepo: { getById: () => Promise.resolve(undefined) },
      bridge: createAutomationBridge(),
      renamer: makeRenamer(),
      logger: createNoopLogger(),
      area,
    });

    const result = await executor.generate({ promptText: "a fox", imageIndex: 0, settings });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/No active tab/);
  });

  it("fails with a clear error when the tab is unreachable", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, completeRegistry(), area);
    const executor = createRealAutomationExecutor({
      tabs: createFakeTabs({ activeTab: { id: 5 }, unreachableTabId: 5 }),
      imagesRepo: { getById: () => Promise.resolve(undefined) },
      bridge: createAutomationBridge(),
      renamer: makeRenamer(),
      logger: createNoopLogger(),
      area,
    });

    const result = await executor.generate({ promptText: "a fox", imageIndex: 0, settings });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Couldn't reach the Google Flow tab/);
  });

  it("sends the captured selectors and prompt text, and resolves ok on success", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, completeRegistry(), area);
    const tabs = createFakeTabs({ activeTab: { id: 7 } });
    const bridge = createAutomationBridge();
    const executor = createRealAutomationExecutor({
      tabs,
      imagesRepo: { getById: () => Promise.resolve(undefined) },
      bridge,
      renamer: makeRenamer(),
      logger: createNoopLogger(),
      area,
    });

    const resultPromise = executor.generate({ promptText: "a neon fox", imageIndex: 0, settings });
    await new Promise((r) => setTimeout(r, 0));

    expect(tabs.sentMessages).toHaveLength(1);
    const command = tabs.sentMessages[0]?.message as {
      requestId: string;
      promptText: string;
      selectors: unknown;
      clickDownload: boolean;
    };
    expect(command.promptText).toBe("a neon fox");
    expect(command.selectors).toEqual({
      promptBox: "#prompt",
      generateButton: "#generate",
      downloadButton: "#download",
      referenceUpload: undefined,
    });
    expect(command.clickDownload).toBe(true);

    bridge.handleMessage({
      type: "MYFLOW_AUTOMATION_COMPLETE",
      requestId: command.requestId,
      ok: true,
    });
    await expect(resultPromise).resolves.toEqual({ ok: true });
  });

  it("tells the renamer to expect a download, built from the queue item's index and prompt text, when autoDownload is on", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, completeRegistry(), area);
    const tabs = createFakeTabs({ activeTab: { id: 7 } });
    const bridge = createAutomationBridge();
    const renamer = makeRenamer();
    const executor = createRealAutomationExecutor({
      tabs,
      imagesRepo: { getById: () => Promise.resolve(undefined) },
      bridge,
      renamer,
      logger: createNoopLogger(),
      area,
    });

    const resultPromise = executor.generate({
      promptText: "a neon fox",
      imageIndex: 3,
      settings: {
        ...settings,
        autoDownload: true,
        startNumber: 1,
        numberPadding: 4,
        filenameTemplate: "numbered",
      },
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(renamer.expectedNames).toEqual(["0004"]);

    const command = tabs.sentMessages[0]?.message as { requestId: string };
    bridge.handleMessage({
      type: "MYFLOW_AUTOMATION_COMPLETE",
      requestId: command.requestId,
      ok: true,
    });
    await resultPromise;
  });

  it("strips the placeholder extension even with the numbered-prompt template's slug suffix", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, completeRegistry(), area);
    const tabs = createFakeTabs({ activeTab: { id: 7 } });
    const bridge = createAutomationBridge();
    const renamer = makeRenamer();
    const executor = createRealAutomationExecutor({
      tabs,
      imagesRepo: { getById: () => Promise.resolve(undefined) },
      bridge,
      renamer,
      logger: createNoopLogger(),
      area,
    });

    const resultPromise = executor.generate({
      promptText: "A Neon Fox!",
      imageIndex: 0,
      settings: {
        ...settings,
        autoDownload: true,
        startNumber: 1,
        numberPadding: 4,
        filenameTemplate: "numbered-prompt",
      },
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(renamer.expectedNames).toEqual(["0001_A_Neon_Fox"]);

    const command = tabs.sentMessages[0]?.message as { requestId: string };
    bridge.handleMessage({
      type: "MYFLOW_AUTOMATION_COMPLETE",
      requestId: command.requestId,
      ok: true,
    });
    await resultPromise;
  });

  it("never tells the renamer to expect a download when autoDownload is off", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, completeRegistry(), area);
    const tabs = createFakeTabs({ activeTab: { id: 7 } });
    const bridge = createAutomationBridge();
    const renamer = makeRenamer();
    const executor = createRealAutomationExecutor({
      tabs,
      imagesRepo: { getById: () => Promise.resolve(undefined) },
      bridge,
      renamer,
      logger: createNoopLogger(),
      area,
    });

    const resultPromise = executor.generate({
      promptText: "a fox",
      imageIndex: 0,
      settings: { ...settings, autoDownload: false },
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(renamer.expectedNames).toEqual([]);

    const command = tabs.sentMessages[0]?.message as { requestId: string; clickDownload: boolean };
    expect(command.clickDownload).toBe(false);
    bridge.handleMessage({
      type: "MYFLOW_AUTOMATION_COMPLETE",
      requestId: command.requestId,
      ok: true,
    });
    await resultPromise;
  });

  it("propagates a failure reported by the content script", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, completeRegistry(), area);
    const tabs = createFakeTabs({ activeTab: { id: 7 } });
    const bridge = createAutomationBridge();
    const executor = createRealAutomationExecutor({
      tabs,
      imagesRepo: { getById: () => Promise.resolve(undefined) },
      bridge,
      renamer: makeRenamer(),
      logger: createNoopLogger(),
      area,
    });

    const resultPromise = executor.generate({ promptText: "a fox", imageIndex: 0, settings });
    await new Promise((r) => setTimeout(r, 0));
    const requestId = (tabs.sentMessages[0]?.message as { requestId: string }).requestId;

    bridge.handleMessage({
      type: "MYFLOW_AUTOMATION_COMPLETE",
      requestId,
      ok: false,
      error: "Prompt box not found.",
    });
    await expect(resultPromise).resolves.toEqual({ ok: false, error: "Prompt box not found." });
  });

  it("resolves reference image ids to base64 payloads for the content script", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, completeRegistry(), area);
    const tabs = createFakeTabs({ activeTab: { id: 7 } });
    const bridge = createAutomationBridge();
    const blob = new Blob(["fake-image-bytes"], { type: "image/png" });
    const stored: StoredImage = {
      id: "img-1",
      kind: "reference",
      projectId: null,
      promptId: null,
      fileName: "fox.png",
      mimeType: "image/png",
      blob,
      createdAt: Date.now(),
    };
    const executor = createRealAutomationExecutor({
      tabs,
      imagesRepo: { getById: (id) => Promise.resolve(id === "img-1" ? stored : undefined) },
      bridge,
      renamer: makeRenamer(),
      logger: createNoopLogger(),
      area,
    });

    const resultPromise = executor.generate({
      promptText: "a fox",
      referenceImageIds: ["img-1", "missing-id"],
      imageIndex: 0,
      settings,
    });
    await new Promise((r) => setTimeout(r, 0));

    const command = tabs.sentMessages[0]?.message as {
      requestId: string;
      referenceImages: { fileName: string; mimeType: string }[];
    };
    expect(command.referenceImages).toHaveLength(1);
    expect(command.referenceImages[0]).toMatchObject({
      fileName: "fox.png",
      mimeType: "image/png",
    });

    bridge.handleMessage({
      type: "MYFLOW_AUTOMATION_COMPLETE",
      requestId: command.requestId,
      ok: true,
    });
    await resultPromise;
  });

  it("times out with a clear error if the content script never responds", async () => {
    vi.useFakeTimers();
    try {
      const area = createFakeStorageArea();
      await setValue(selectorRegistryStorageKey, completeRegistry(), area);
      const tabs = createFakeTabs({ activeTab: { id: 7 } });
      const bridge = createAutomationBridge();
      const executor = createRealAutomationExecutor({
        tabs,
        imagesRepo: { getById: () => Promise.resolve(undefined) },
        bridge,
        renamer: makeRenamer(),
        logger: createNoopLogger(),
        area,
      });

      const resultPromise = executor.generate({ promptText: "a fox", imageIndex: 0, settings });
      await vi.advanceTimersByTimeAsync(60_000);

      await expect(resultPromise).resolves.toEqual({
        ok: false,
        error: "Timed out waiting for a response from the Google Flow tab.",
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
