import { selectorRegistryStorageKey } from "@shared/storage/selectorRegistryStorage";
import type { CapturableElementRole } from "@shared/devtools/roles";
import type { SelectorRegistry } from "@shared/devtools/registry";
import { useStorageValue } from "./useStorageValue";

export interface UseSelectorRegistryResult {
  registry: SelectorRegistry;
  clearSelector: (role: CapturableElementRole) => void;
}

export function useSelectorRegistry(): UseSelectorRegistryResult {
  const [registry, setRegistry] = useStorageValue(selectorRegistryStorageKey);

  function clearSelector(role: CapturableElementRole): void {
    const next = Object.fromEntries(
      Object.entries(registry).filter(([key]) => key !== role),
    ) as SelectorRegistry;
    setRegistry(next);
  }

  return { registry, clearSelector };
}
