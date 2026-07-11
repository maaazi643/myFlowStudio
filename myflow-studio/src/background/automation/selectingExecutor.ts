import type {
  AutomationExecutor,
  AutomationRequest,
  AutomationResult,
} from "@shared/automation/executor";
import { getValue } from "@shared/storage/chromeStorage";
import type { StorageArea } from "@shared/storage/chromeStorage";
import { selectorRegistryStorageKey } from "@shared/storage/selectorRegistryStorage";
import { isRegistryComplete } from "@shared/devtools/registry";

export interface SelectingExecutorDeps {
  real: AutomationExecutor;
  simulated: AutomationExecutor;
  area?: StorageArea;
}

/**
 * Picks the real executor once Developer Mode's required selectors are all
 * captured, and falls back to the simulated one otherwise — checked fresh
 * on every generate() call, so the queue upgrades automatically the moment
 * capture finishes, with no service worker restart needed.
 */
export function createSelectingAutomationExecutor(deps: SelectingExecutorDeps): AutomationExecutor {
  return {
    async generate(request: AutomationRequest): Promise<AutomationResult> {
      const registry = await getValue(selectorRegistryStorageKey, deps.area);
      const executor = isRegistryComplete(registry) ? deps.real : deps.simulated;
      return executor.generate(request);
    },
  };
}
