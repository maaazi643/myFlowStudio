import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMessageRouter } from "@background/messaging/router";
import { createLogger } from "@background/logging/logger";
import { createLogsRepository } from "@shared/storage/indexedDb/repositories";
import { resetDatabaseConnectionForTests } from "@shared/storage/indexedDb/db";
import { createFakePort } from "../../mocks/fakePort";

beforeEach(() => {
  resetDatabaseConnectionForTests();
});

afterEach(async () => {
  resetDatabaseConnectionForTests();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("myflow-studio");
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(new Error("Failed to delete test database."));
    };
  });
});

function waitUntil(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createLogger", () => {
  it("persists an info entry and broadcasts it", async () => {
    const router = createMessageRouter();
    const port = createFakePort();
    router.attachPort(port);
    const repo = createLogsRepository();
    const logger = createLogger(router, repo);

    logger.info("content script ready", { pageUrl: "https://labs.google/fx" });
    await waitUntil();
    await waitUntil();

    const stored = await repo.getAll();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      level: "info",
      message: "content script ready",
      context: { pageUrl: "https://labs.google/fx" },
    });

    expect(port.sent).toHaveLength(1);
    const broadcast = port.sent[0] as {
      kind: string;
      event: { type: string; entry: { message: string } };
    };
    expect(broadcast.event.type).toBe("LOG_APPENDED");
    expect(broadcast.event.entry.message).toBe("content script ready");
  });

  it("writes warning and error at their own levels", async () => {
    const router = createMessageRouter();
    const repo = createLogsRepository();
    const logger = createLogger(router, repo);

    logger.warning("selector looks fragile");
    logger.error("prompt box not found");
    await waitUntil();
    await waitUntil();

    const stored = await repo.getAll();
    const levels = stored.map((entry) => entry.level).sort();
    expect(levels).toEqual(["error", "warning"]);
  });

  it("gives every entry a unique id and a timestamp", async () => {
    const router = createMessageRouter();
    const repo = createLogsRepository();
    const logger = createLogger(router, repo);

    logger.info("one");
    logger.info("two");
    await waitUntil();
    await waitUntil();

    const stored = await repo.getAll();
    expect(stored).toHaveLength(2);
    expect(stored[0]?.id).not.toBe(stored[1]?.id);
    expect(typeof stored[0]?.createdAt).toBe("number");
  });
});
