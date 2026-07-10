import type { ImageKind, StoredImage } from "@shared/types/image";
import { createRepository, getAllByIndex } from "../createRepository";
import type { Repository } from "../createRepository";
import { STORES } from "../db";

export interface ImagesRepository extends Repository<StoredImage> {
  getByProjectId(projectId: string): Promise<StoredImage[]>;
  getByPromptId(promptId: string): Promise<StoredImage[]>;
  getByKind(kind: ImageKind): Promise<StoredImage[]>;
}

export function createImagesRepository(): ImagesRepository {
  return {
    ...createRepository<StoredImage>(STORES.images),
    getByProjectId: (projectId) => getAllByIndex(STORES.images, "projectId", projectId),
    getByPromptId: (promptId) => getAllByIndex(STORES.images, "promptId", promptId),
    getByKind: (kind) => getAllByIndex(STORES.images, "kind", kind),
  };
}
