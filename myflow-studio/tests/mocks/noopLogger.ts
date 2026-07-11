import type { Logger } from "@background/logging/logger";

export function createNoopLogger(): Logger {
  return {
    info: () => undefined,
    warning: () => undefined,
    error: () => undefined,
  };
}
