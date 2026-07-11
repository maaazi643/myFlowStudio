import { defineStorageKey } from "./chromeStorage";
import type { SelectorRegistry } from "@shared/devtools/registry";

export const selectorRegistryStorageKey = defineStorageKey<SelectorRegistry>(
  "selectorRegistry",
  {},
);
