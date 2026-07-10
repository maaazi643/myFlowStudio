import { useCallback, useEffect, useState } from "react";
import {
  createImagesRepository,
  createProjectsRepository,
  createPromptsRepository,
} from "@shared/storage/indexedDb/repositories";
import { activeProjectIdStorageKey } from "@shared/storage/activeProjectStorage";
import { generationSettingsStorageKey } from "@shared/storage/generationSettingsStorage";
import { getValue, setValue } from "@shared/storage/chromeStorage";
import type { Project } from "@shared/types/project";
import type { Prompt } from "@shared/types/prompt";
import type { StoredImage } from "@shared/types/image";
import {
  buildProjectBundle,
  isProjectBundleFile,
  parseProjectBundle,
} from "@shared/utils/projectBundle";
import { slugify } from "@shared/utils/slugify";
import { useStorageValue } from "./useStorageValue";

const projectsRepo = createProjectsRepository();
const promptsRepo = createPromptsRepository();
const imagesRepo = createImagesRepository();

export type ImportProjectResult = { ok: true; projectId: string } | { ok: false; error: string };

export interface UseProjectsResult {
  /** Sorted by most recently updated first. */
  projects: Project[];
  loading: boolean;
  activeProjectId: string | null;
  createProject: (name: string) => Promise<string>;
  /** Pass null to switch back to the default "Unfiled" workspace. */
  openProject: (id: string | null) => Promise<void>;
  saveActiveProject: () => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  exportProject: (id: string) => Promise<void>;
  importProject: (file: File) => Promise<ImportProjectResult>;
}

function sortByUpdatedAtDesc(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useStorageValue(activeProjectIdStorageKey);

  useEffect(() => {
    let cancelled = false;
    void projectsRepo.getAll().then((loaded) => {
      if (!cancelled) {
        setProjects(sortByUpdatedAtDesc(loaded));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const createProject = useCallback(async (name: string) => {
    const now = Date.now();
    const settings = await getValue(generationSettingsStorageKey);
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
      settings,
    };
    await projectsRepo.put(project);
    setProjects((current) => sortByUpdatedAtDesc([...current, project]));
    return project.id;
  }, []);

  const openProject = useCallback(
    async (id: string | null) => {
      setActiveProjectId(id);
      if (id === null) {
        return;
      }
      const project = await projectsRepo.getById(id);
      if (project?.settings) {
        await setValue(generationSettingsStorageKey, project.settings);
      }
    },
    [setActiveProjectId],
  );

  const saveActiveProject = useCallback(async () => {
    if (activeProjectId === null) {
      return;
    }
    const existing = await projectsRepo.getById(activeProjectId);
    if (!existing) {
      return;
    }
    const settings = await getValue(generationSettingsStorageKey);
    const updated: Project = { ...existing, settings, updatedAt: Date.now() };
    await projectsRepo.put(updated);
    setProjects((current) =>
      sortByUpdatedAtDesc(
        current.map((project) => (project.id === updated.id ? updated : project)),
      ),
    );
  }, [activeProjectId]);

  const renameProject = useCallback(async (id: string, name: string) => {
    const existing = await projectsRepo.getById(id);
    if (!existing) {
      return;
    }
    const updated: Project = { ...existing, name, updatedAt: Date.now() };
    await projectsRepo.put(updated);
    setProjects((current) =>
      sortByUpdatedAtDesc(current.map((project) => (project.id === id ? updated : project))),
    );
  }, []);

  const duplicateProject = useCallback(async (id: string) => {
    const original = await projectsRepo.getById(id);
    if (!original) {
      return;
    }
    const now = Date.now();
    const copy: Project = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} copy`,
      createdAt: now,
      updatedAt: now,
    };
    const originalPrompts = await promptsRepo.getByProjectId(id);
    const clonedPrompts: Prompt[] = originalPrompts.map((prompt) => ({
      ...prompt,
      id: crypto.randomUUID(),
      projectId: copy.id,
      createdAt: now,
      updatedAt: now,
    }));
    await projectsRepo.put(copy);
    await Promise.all(clonedPrompts.map((prompt) => promptsRepo.put(prompt)));
    setProjects((current) => sortByUpdatedAtDesc([...current, copy]));
  }, []);

  const deleteProject = useCallback(
    async (id: string) => {
      const projectPrompts = await promptsRepo.getByProjectId(id);
      await Promise.all([
        projectsRepo.delete(id),
        ...projectPrompts.map((prompt) => promptsRepo.delete(prompt.id)),
      ]);
      setProjects((current) => current.filter((project) => project.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
    },
    [activeProjectId, setActiveProjectId],
  );

  const exportProject = useCallback(async (id: string) => {
    const project = await projectsRepo.getById(id);
    if (!project) {
      return;
    }
    const prompts = await promptsRepo.getByProjectId(id);
    const uniqueImageIds = Array.from(
      new Set(prompts.flatMap((prompt) => prompt.referenceImageIds ?? [])),
    );
    const images = (
      await Promise.all(uniqueImageIds.map((imageId) => imagesRepo.getById(imageId)))
    ).filter((image): image is StoredImage => image !== undefined);

    const bundle = await buildProjectBundle({
      projectName: project.name,
      settings: project.settings,
      prompts: prompts.map((prompt) => ({
        text: prompt.text,
        variables: prompt.variables,
        referenceImageIds: prompt.referenceImageIds,
        order: prompt.order,
      })),
      images: images.map((image) => ({
        id: image.id,
        fileName: image.fileName,
        mimeType: image.mimeType,
        blob: image.blob,
      })),
    });

    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(project.name)}.myflow.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const importProject = useCallback(async (file: File): Promise<ImportProjectResult> => {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(await file.text());
    } catch {
      return { ok: false, error: "That file isn't valid JSON." };
    }
    if (!isProjectBundleFile(parsedJson)) {
      return { ok: false, error: "That file isn't a MyFlow Studio project bundle." };
    }

    const parsed = parseProjectBundle(parsedJson);
    const now = Date.now();
    const project: Project = {
      id: crypto.randomUUID(),
      name: parsed.name,
      createdAt: now,
      updatedAt: now,
      settings: parsed.settings,
    };
    const newImages: StoredImage[] = parsed.images.map((image) => ({
      id: crypto.randomUUID(),
      kind: "reference",
      projectId: null,
      promptId: null,
      fileName: image.fileName,
      mimeType: image.mimeType,
      blob: image.blob,
      createdAt: now,
    }));
    const newPrompts: Prompt[] = parsed.prompts.map((prompt) => {
      const referenceImageIds = prompt.referenceImageIndexes
        .map((index) => newImages[index]?.id)
        .filter((imageId): imageId is string => imageId !== undefined);
      return {
        id: crypto.randomUUID(),
        projectId: project.id,
        text: prompt.text,
        variables: prompt.variables,
        referenceImageIds: referenceImageIds.length > 0 ? referenceImageIds : undefined,
        order: prompt.order,
        createdAt: now,
        updatedAt: now,
      };
    });

    await projectsRepo.put(project);
    await Promise.all([
      ...newImages.map((image) => imagesRepo.put(image)),
      ...newPrompts.map((prompt) => promptsRepo.put(prompt)),
    ]);
    setProjects((current) => sortByUpdatedAtDesc([...current, project]));
    return { ok: true, projectId: project.id };
  }, []);

  return {
    projects,
    loading,
    activeProjectId,
    createProject,
    openProject,
    saveActiveProject,
    renameProject,
    duplicateProject,
    deleteProject,
    exportProject,
    importProject,
  };
}
