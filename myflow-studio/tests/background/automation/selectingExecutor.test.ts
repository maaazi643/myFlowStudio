import { describe, expect, it } from "vitest";
import { createSelectingAutomationExecutor } from "@background/automation/selectingExecutor";
import { setValue } from "@shared/storage/chromeStorage";
import { selectorRegistryStorageKey } from "@shared/storage/selectorRegistryStorage";
import type { AutomationExecutor } from "@shared/automation/executor";
import type { CapturedSelector, SelectorRegistry } from "@shared/devtools/registry";
import { DEFAULT_GENERATION_SETTINGS } from "@shared/storage/generationSettingsStorage";
import { createFakeStorageArea } from "../../mocks/fakeStorageArea";

function makeCaptured(role: CapturedSelector["role"]): CapturedSelector {
  return {
    role,
    selector: `#${role}`,
    confidence: "high",
    reason: "id attribute",
    tagName: "div",
    pageUrl: "https://labs.google/fx/tools/flow",
    capturedAt: Date.now(),
  };
}

function makeExecutor(): AutomationExecutor & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    generate: (request) => {
      calls.push(request.promptText);
      return Promise.resolve({ ok: true, error: undefined });
    },
  };
}

describe("createSelectingAutomationExecutor", () => {
  it("uses the simulated executor when the registry is incomplete", async () => {
    const area = createFakeStorageArea();
    const real = makeExecutor();
    const simulated = makeExecutor();
    const executor = createSelectingAutomationExecutor({ real, simulated, area });

    await executor.generate({ promptText: "a fox", settings: DEFAULT_GENERATION_SETTINGS });

    expect(simulated.calls).toEqual(["a fox"]);
    expect(real.calls).toEqual([]);
  });

  it("uses the real executor once all required roles are captured", async () => {
    const area = createFakeStorageArea();
    const registry: SelectorRegistry = {
      promptBox: makeCaptured("promptBox"),
      generateButton: makeCaptured("generateButton"),
      downloadButton: makeCaptured("downloadButton"),
    };
    await setValue(selectorRegistryStorageKey, registry, area);
    const real = makeExecutor();
    const simulated = makeExecutor();
    const executor = createSelectingAutomationExecutor({ real, simulated, area });

    await executor.generate({ promptText: "a fox", settings: DEFAULT_GENERATION_SETTINGS });

    expect(real.calls).toEqual(["a fox"]);
    expect(simulated.calls).toEqual([]);
  });

  it("still uses the simulated executor when only some required roles are captured", async () => {
    const area = createFakeStorageArea();
    await setValue(selectorRegistryStorageKey, { promptBox: makeCaptured("promptBox") }, area);
    const real = makeExecutor();
    const simulated = makeExecutor();
    const executor = createSelectingAutomationExecutor({ real, simulated, area });

    await executor.generate({ promptText: "a fox", settings: DEFAULT_GENERATION_SETTINGS });

    expect(simulated.calls).toEqual(["a fox"]);
    expect(real.calls).toEqual([]);
  });

  it("re-checks the registry on every call, upgrading mid-session once capture finishes", async () => {
    const area = createFakeStorageArea();
    const real = makeExecutor();
    const simulated = makeExecutor();
    const executor = createSelectingAutomationExecutor({ real, simulated, area });

    await executor.generate({ promptText: "first", settings: DEFAULT_GENERATION_SETTINGS });
    expect(simulated.calls).toEqual(["first"]);

    await setValue(
      selectorRegistryStorageKey,
      {
        promptBox: makeCaptured("promptBox"),
        generateButton: makeCaptured("generateButton"),
        downloadButton: makeCaptured("downloadButton"),
      },
      area,
    );
    await executor.generate({ promptText: "second", settings: DEFAULT_GENERATION_SETTINGS });

    expect(real.calls).toEqual(["second"]);
    expect(simulated.calls).toEqual(["first"]);
  });
});
