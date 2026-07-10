import type { GenerationSettings } from "@shared/types/generationSettings";
import { base64ToBlob, blobToBase64 } from "./base64";

export const PROJECT_BUNDLE_FORMAT_VERSION = 1;

export interface ProjectBundlePrompt {
  text: string;
  variables?: Record<string, string> | undefined;
  /** Indexes into the bundle's images array — resolved to real StoredImage ids on import. */
  referenceImageIndexes?: number[] | undefined;
  order: number;
}

export interface ProjectBundleImage {
  fileName: string;
  mimeType: string;
  /** Base64-encoded blob bytes — JSON-safe. */
  dataBase64: string;
}

export interface ProjectBundleFile {
  formatVersion: number;
  name: string;
  settings?: GenerationSettings | undefined;
  prompts: ProjectBundlePrompt[];
  images: ProjectBundleImage[];
  exportedAt: number;
}

export interface BuildBundleInputPrompt {
  text: string;
  variables?: Record<string, string> | undefined;
  referenceImageIds?: string[] | undefined;
  order: number;
}

export interface BuildBundleInputImage {
  id: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
}

export interface BuildBundleInput {
  projectName: string;
  settings?: GenerationSettings | undefined;
  prompts: BuildBundleInputPrompt[];
  /** Only the unique images actually referenced by `prompts`. */
  images: BuildBundleInputImage[];
}

/** Serializes a project's prompts, settings, and referenced images into a JSON-safe, portable file shape. */
export async function buildProjectBundle(input: BuildBundleInput): Promise<ProjectBundleFile> {
  const idToIndex = new Map(input.images.map((image, index) => [image.id, index]));

  const images = await Promise.all(
    input.images.map(async (image) => ({
      fileName: image.fileName,
      mimeType: image.mimeType,
      dataBase64: await blobToBase64(image.blob),
    })),
  );

  const prompts = input.prompts.map((prompt) => {
    const referenceImageIndexes = prompt.referenceImageIds
      ?.map((id) => idToIndex.get(id))
      .filter((index): index is number => index !== undefined);
    return {
      text: prompt.text,
      variables: prompt.variables,
      referenceImageIndexes:
        referenceImageIndexes && referenceImageIndexes.length > 0
          ? referenceImageIndexes
          : undefined,
      order: prompt.order,
    };
  });

  return {
    formatVersion: PROJECT_BUNDLE_FORMAT_VERSION,
    name: input.projectName,
    settings: input.settings,
    prompts,
    images,
    exportedAt: Date.now(),
  };
}

export interface ParsedBundleImage {
  fileName: string;
  mimeType: string;
  blob: Blob;
}

export interface ParsedBundlePrompt {
  text: string;
  variables?: Record<string, string> | undefined;
  referenceImageIndexes: number[];
  order: number;
}

export interface ParsedBundle {
  name: string;
  settings?: GenerationSettings | undefined;
  images: ParsedBundleImage[];
  prompts: ParsedBundlePrompt[];
}

/** Inverse of buildProjectBundle — decodes base64 image data back into Blobs. */
export function parseProjectBundle(file: ProjectBundleFile): ParsedBundle {
  return {
    name: file.name,
    settings: file.settings,
    images: file.images.map((image) => ({
      fileName: image.fileName,
      mimeType: image.mimeType,
      blob: base64ToBlob(image.dataBase64, image.mimeType),
    })),
    prompts: file.prompts.map((prompt) => ({
      text: prompt.text,
      variables: prompt.variables,
      referenceImageIndexes: prompt.referenceImageIndexes ?? [],
      order: prompt.order,
    })),
  };
}

/**
 * Structural validation for untrusted JSON at the import boundary — a
 * hand-edited or corrupted file should fail cleanly here rather than throw
 * deep inside the import flow. Deliberately does not validate `settings`
 * against the generation-settings registries: an unrecognized settings
 * snapshot just gets dropped on import (see projects.ts), not treated as a
 * reason to reject the whole bundle.
 */
export function isProjectBundleFile(value: unknown): value is ProjectBundleFile {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.formatVersion !== "number" || typeof candidate.name !== "string") {
    return false;
  }
  if (!Array.isArray(candidate.prompts) || !Array.isArray(candidate.images)) {
    return false;
  }
  const promptsValid = candidate.prompts.every(
    (prompt: unknown) =>
      typeof prompt === "object" &&
      prompt !== null &&
      typeof (prompt as Record<string, unknown>).text === "string" &&
      typeof (prompt as Record<string, unknown>).order === "number",
  );
  const imagesValid = candidate.images.every(
    (image: unknown) =>
      typeof image === "object" &&
      image !== null &&
      typeof (image as Record<string, unknown>).fileName === "string" &&
      typeof (image as Record<string, unknown>).mimeType === "string" &&
      typeof (image as Record<string, unknown>).dataBase64 === "string",
  );
  return promptsValid && imagesValid;
}
