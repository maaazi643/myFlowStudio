import { defineStorageKey } from "./chromeStorage";

/** null means the default "Unfiled" workspace — the scope every prompt had before projects existed. */
export const activeProjectIdStorageKey = defineStorageKey<string | null>("activeProjectId", null);
