import type { Prompt } from "@shared/types/prompt";
import type { QueueItem } from "@shared/types/queue";
import { resolvePromptText } from "./promptVariables";

/**
 * Expands prompts into one item per image (imagesPerPrompt repeats each
 * prompt) and resolves {{variables}} now — a queue run is a snapshot, so
 * editing a prompt mid-run can't retroactively change what's generated.
 */
export function buildQueueItems(prompts: readonly Prompt[], imagesPerPrompt: number): QueueItem[] {
  const items: QueueItem[] = [];
  let globalIndex = 0;

  for (const prompt of prompts) {
    const resolvedText = resolvePromptText(prompt.text, prompt.variables);
    for (
      let imageIndexForPrompt = 0;
      imageIndexForPrompt < imagesPerPrompt;
      imageIndexForPrompt += 1
    ) {
      items.push({
        id: crypto.randomUUID(),
        promptId: prompt.id,
        promptText: resolvedText,
        referenceImageIds: prompt.referenceImageIds,
        imageIndexForPrompt,
        globalIndex,
        status: "pending",
        attempts: 0,
      });
      globalIndex += 1;
    }
  }

  return items;
}
