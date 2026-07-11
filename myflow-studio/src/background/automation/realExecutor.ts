import type {
  AutomationExecutor,
  AutomationRequest,
  AutomationResult,
} from "@shared/automation/executor";
import type { RunAutomationCommand } from "@shared/automation/contentAutomationProtocol";
import { getValue } from "@shared/storage/chromeStorage";
import type { StorageArea } from "@shared/storage/chromeStorage";
import { selectorRegistryStorageKey } from "@shared/storage/selectorRegistryStorage";
import { isRegistryComplete } from "@shared/devtools/registry";
import { blobToBase64 } from "@shared/utils/base64";
import { getSpeedProfile } from "@shared/config/speedProfiles";
import { buildFilename } from "@shared/utils/filenameBuilder";
import type { ImagesRepository } from "@shared/storage/indexedDb/repositories";
import type { TabsLike } from "../devMode/tabsBridge";
import type { AutomationBridge } from "./automationBridge";
import type { DownloadRenamer } from "../downloads/downloadNaming";
import type { Logger } from "../logging/logger";

export interface RealAutomationExecutorDeps {
  tabs: TabsLike;
  imagesRepo: Pick<ImagesRepository, "getById">;
  bridge: AutomationBridge;
  renamer: DownloadRenamer;
  logger: Logger;
  area?: StorageArea;
}

const DEFAULT_MAX_WAIT_MS = 30000;
/** Extra padding above maxWaitMs before the executor itself gives up waiting for a reply. */
const REPLY_TIMEOUT_SAFETY_MS = 10000;

/**
 * Drives the real Google Flow page using only whatever Developer Mode has
 * captured — never a hardcoded selector. Requires the prompt box, generate
 * button, and download button to be captured; model/aspect-ratio/quality
 * selectors are accepted but not acted on (see contentAutomationProtocol.ts
 * for why).
 */
export function createRealAutomationExecutor(deps: RealAutomationExecutorDeps): AutomationExecutor {
  const { tabs, imagesRepo, bridge, renamer, logger, area } = deps;

  return {
    async generate(request: AutomationRequest): Promise<AutomationResult> {
      logger.info("Real automation executor invoked — reading the selector registry.");
      const registry = await getValue(selectorRegistryStorageKey, area);
      const capturedRoles = Object.keys(registry);
      logger.info(
        `Selector registry loaded: ${String(capturedRoles.length)} role(s) captured (${capturedRoles.join(", ") || "none"}).`,
      );
      if (!isRegistryComplete(registry)) {
        const error =
          "Developer Mode setup isn't complete — capture the prompt box, generate button, and download button first.";
        logger.error(error);
        return { ok: false, error };
      }
      const { promptBox, generateButton, downloadButton, referenceUpload } = registry;
      if (!promptBox || !generateButton) {
        const error =
          "Developer Mode setup isn't complete — capture the prompt box, generate button, and download button first.";
        logger.error(error);
        return { ok: false, error };
      }
      logger.info(`Using promptBox selector: ${promptBox.selector}`);
      logger.info(`Using generateButton selector: ${generateButton.selector}`);
      logger.info(
        `Using downloadButton selector: ${downloadButton ? downloadButton.selector : "(not captured)"}`,
      );
      logger.info(
        `Using referenceUpload selector: ${referenceUpload ? referenceUpload.selector : "(not captured)"}`,
      );

      const tab = await tabs.queryActiveTab();
      if (!tab) {
        const error =
          "No active tab found. Keep the Google Flow tab open and focused while the queue runs.";
        logger.error(error);
        return { ok: false, error };
      }
      logger.info(`Active tab found (id ${String(tab.id)}) — sending the automation command.`);

      const referenceImages = (
        await Promise.all(
          (request.referenceImageIds ?? []).map(async (id) => {
            const image = await imagesRepo.getById(id);
            if (!image) {
              return null;
            }
            return {
              fileName: image.fileName,
              mimeType: image.mimeType,
              dataBase64: await blobToBase64(image.blob),
            };
          }),
        )
      ).filter((image): image is NonNullable<typeof image> => image !== null);

      const profile = getSpeedProfile(request.settings.speedProfileId);
      const maxWaitMs = profile ? profile.delayBetweenPromptsMs.max * 3 : DEFAULT_MAX_WAIT_MS;
      const requestId = crypto.randomUUID();

      const command: RunAutomationCommand = {
        type: "MYFLOW_RUN_AUTOMATION",
        requestId,
        promptText: request.promptText,
        referenceImages,
        selectors: {
          promptBox: promptBox.selector,
          generateButton: generateButton.selector,
          downloadButton: downloadButton?.selector,
          referenceUpload: referenceUpload?.selector,
        },
        clickDownload: request.settings.autoDownload,
        maxWaitMs,
      };

      if (command.clickDownload) {
        // buildFilename always appends its own default extension (for the
        // Settings-screen live preview) — the renamer re-appends whatever
        // the actual download's real extension turns out to be, so that
        // placeholder has to come off here first.
        const builtName = buildFilename({
          index: request.imageIndex,
          startNumber: request.settings.startNumber,
          padding: request.settings.numberPadding,
          template: request.settings.filenameTemplate,
          promptText: request.promptText,
        });
        renamer.expectNextDownloadAs(builtName.replace(/\.[^.]+$/, ""));
      }

      const resultPromise = bridge.waitFor(requestId);
      try {
        await tabs.sendMessage(tab.id, command);
      } catch {
        const error =
          "Couldn't reach the Google Flow tab. Make sure it's open, focused, and fully loaded.";
        logger.error(error);
        return { ok: false, error };
      }

      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, maxWaitMs + REPLY_TIMEOUT_SAFETY_MS);
      });
      const event = await Promise.race([resultPromise, timeoutPromise]);
      if (!event) {
        const error = "Timed out waiting for a response from the Google Flow tab.";
        logger.error(error);
        return { ok: false, error };
      }
      if (event.ok) {
        logger.info("Automation reported success.");
        return { ok: true };
      }
      const error = event.error ?? "Automation failed.";
      logger.error(`Automation reported failure: ${error}`);
      return { ok: false, error };
    },
  };
}
