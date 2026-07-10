import { createPromptsRepository } from "@shared/storage/indexedDb/repositories";
import { getValue } from "@shared/storage/chromeStorage";
import { generationSettingsStorageKey } from "@shared/storage/generationSettingsStorage";
import { sortPrompts } from "@shared/utils/promptOrdering";
import { validateGenerationSettings } from "@shared/utils/validators/generationSettingsValidator";
import type { MessageRouter } from "../messaging/router";
import type { QueueEngine } from "./queueEngine";

export function registerQueueHandlers(router: MessageRouter, engine: QueueEngine): void {
  const promptsRepo = createPromptsRepository();

  router.registerHandler("QUEUE_START", async () => {
    const [prompts, settings] = await Promise.all([
      promptsRepo.getAll(),
      getValue(generationSettingsStorageKey),
    ]);

    const validation = validateGenerationSettings(settings);
    if (!validation.valid) {
      throw new Error("Fix the highlighted settings before starting.");
    }
    if (prompts.length === 0) {
      throw new Error("Add at least one prompt before starting.");
    }

    return engine.start(sortPrompts(prompts, "manual"), settings);
  });

  router.registerHandler("QUEUE_PAUSE", () => {
    engine.pause();
    return Promise.resolve(engine.getState());
  });

  router.registerHandler("QUEUE_RESUME", () => {
    engine.resume();
    return Promise.resolve(engine.getState());
  });

  router.registerHandler("QUEUE_STOP", () => {
    engine.stop();
    return Promise.resolve(engine.getState());
  });

  router.registerHandler("QUEUE_SKIP_CURRENT", () => {
    engine.skipCurrent();
    return Promise.resolve(engine.getState());
  });

  router.registerHandler("QUEUE_RETRY_ITEM", (message) => {
    engine.retryItem(message.itemId);
    return Promise.resolve(engine.getState());
  });

  router.registerHandler("QUEUE_RETRY_ALL_FAILED", () => {
    engine.retryAllFailed();
    return Promise.resolve(engine.getState());
  });

  router.registerHandler("QUEUE_RETRY_SELECTED", (message) => {
    engine.retrySelected(message.itemIds);
    return Promise.resolve(engine.getState());
  });

  router.registerHandler("QUEUE_GET_STATE", () => Promise.resolve(engine.getState()));
}
