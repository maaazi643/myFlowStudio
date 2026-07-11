import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDatabaseConnectionForTests } from "@shared/storage/indexedDb/db";
import {
  createImagesRepository,
  createLogsRepository,
  createProjectsRepository,
  createPromptsRepository,
} from "@shared/storage/indexedDb/repositories";
import type { LogEntry } from "@shared/types/logEntry";
import type { Prompt } from "@shared/types/prompt";
import type { StoredImage } from "@shared/types/image";

function makePrompt(overrides: Partial<Prompt> = {}): Prompt {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    projectId: null,
    text: "a neon jellyfish over Tokyo at night",
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

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
      reject(new Error("Failed to reset the test database."));
    };
  });
});

describe("createRepository (via promptsRepository)", () => {
  it("starts empty", async () => {
    const repo = createPromptsRepository();
    await expect(repo.getAll()).resolves.toEqual([]);
    await expect(repo.count()).resolves.toBe(0);
  });

  it("round-trips an entity through put/getById/getAll", async () => {
    const repo = createPromptsRepository();
    const prompt = makePrompt();

    await repo.put(prompt);

    await expect(repo.getById(prompt.id)).resolves.toEqual(prompt);
    await expect(repo.getAll()).resolves.toEqual([prompt]);
    await expect(repo.count()).resolves.toBe(1);
  });

  it("overwrites on put with the same id", async () => {
    const repo = createPromptsRepository();
    const prompt = makePrompt();

    await repo.put(prompt);
    const updated: Prompt = { ...prompt, text: "same jellyfish, more neon" };
    await repo.put(updated);

    await expect(repo.getAll()).resolves.toEqual([updated]);
  });

  it("deletes an entity", async () => {
    const repo = createPromptsRepository();
    const prompt = makePrompt();
    await repo.put(prompt);

    await repo.delete(prompt.id);

    await expect(repo.getById(prompt.id)).resolves.toBeUndefined();
    await expect(repo.count()).resolves.toBe(0);
  });
});

describe("promptsRepository.getByProjectId", () => {
  it("returns only prompts belonging to the given project", async () => {
    const repo = createPromptsRepository();
    const inProject = makePrompt({ projectId: "project-a" });
    const otherProject = makePrompt({ projectId: "project-b" });
    const unassigned = makePrompt({ projectId: null });
    await Promise.all([repo.put(inProject), repo.put(otherProject), repo.put(unassigned)]);

    const result = await repo.getByProjectId("project-a");

    expect(result).toEqual([inProject]);
  });
});

describe("imagesRepository", () => {
  function makeImage(overrides: Partial<StoredImage> = {}): StoredImage {
    return {
      id: crypto.randomUUID(),
      kind: "generated",
      projectId: null,
      promptId: null,
      fileName: "0001.png",
      mimeType: "image/png",
      blob: new Blob(["fake-bytes"], { type: "image/png" }),
      createdAt: Date.now(),
      ...overrides,
    };
  }

  it("filters by kind", async () => {
    const repo = createImagesRepository();
    const generated = makeImage({ kind: "generated" });
    const reference = makeImage({ kind: "reference" });
    await Promise.all([repo.put(generated), repo.put(reference)]);

    await expect(repo.getByKind("reference")).resolves.toEqual([reference]);
  });

  it("filters by promptId", async () => {
    const repo = createImagesRepository();
    const forPrompt = makeImage({ promptId: "prompt-a" });
    const forOtherPrompt = makeImage({ promptId: "prompt-b" });
    await Promise.all([repo.put(forPrompt), repo.put(forOtherPrompt)]);

    await expect(repo.getByPromptId("prompt-a")).resolves.toEqual([forPrompt]);
  });
});

describe("logsRepository.getRecent", () => {
  it("returns entries newest-first, capped at the limit", async () => {
    const repo = createLogsRepository();
    const entries: LogEntry[] = Array.from({ length: 5 }, (_, index) => ({
      id: crypto.randomUUID(),
      level: "info",
      message: `step ${index.toString()}`,
      createdAt: index,
    }));
    await Promise.all(entries.map((entry) => repo.put(entry)));

    const recent = await repo.getRecent(3);

    expect(recent.map((entry) => entry.message)).toEqual(["step 4", "step 3", "step 2"]);
  });
});

describe("logsRepository.clear", () => {
  it("removes every stored entry", async () => {
    const repo = createLogsRepository();
    await repo.put({ id: crypto.randomUUID(), level: "info", message: "one", createdAt: 1 });
    await repo.put({ id: crypto.randomUUID(), level: "error", message: "two", createdAt: 2 });

    await repo.clear();

    await expect(repo.getAll()).resolves.toEqual([]);
  });
});

describe("projectsRepository", () => {
  it("supports basic CRUD", async () => {
    const repo = createProjectsRepository();
    const now = Date.now();
    const project = { id: crypto.randomUUID(), name: "Neon City", createdAt: now, updatedAt: now };

    await repo.put(project);

    await expect(repo.getAll()).resolves.toEqual([project]);
  });
});
