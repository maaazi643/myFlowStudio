import type {
  AutomationExecutor,
  AutomationRequest,
  AutomationResult,
} from "@shared/automation/executor";
import { getValue } from "@shared/storage/chromeStorage";
import type { StorageArea } from "@shared/storage/chromeStorage";
import { selectorRegistryStorageKey } from "@shared/storage/selectorRegistryStorage";
import { isRegistryComplete } from "@shared/devtools/registry";
import type { Logger } from "../logging/logger";

export interface SelectingExecutorDeps {
  real: AutomationExecutor;
  simulated: AutomationExecutor;
  logger: Logger;
  area?: StorageArea;
}

/**
 * Picks the real executor once Developer Mode's required selectors are all
 * captured, and falls back to the simulated one otherwise — checked fresh
 * on every generate() call, so the queue upgrades automatically the moment
 * capture finishes, with no service worker restart needed. Logs which one
 * it picked every time, since silently running the simulated placeholder
 * when the user expected real automation is exactly the kind of thing that
 * needs to be visible, not just correct.
 */
export function createSelectingAutomationExecutor(deps: SelectingExecutorDeps): AutomationExecutor {
  return {
    async generate(request: AutomationRequest): Promise<AutomationResult> {
      const registry = await getValue(selectorRegistryStorageKey, deps.area);
      const complete = isRegistryComplete(registry);
      deps.logger.info(
        complete
          ? "Using the real automation executor (all required selectors are captured)."
          : "Using the SIMULATED placeholder executor — required selectors aren't all captured yet. Nothing will happen on the real page. Finish Developer Mode capture to enable real automation.",
      );
      const executor = complete ? deps.real : deps.simulated;
      return executor.generate(request);
    },
  };
}
