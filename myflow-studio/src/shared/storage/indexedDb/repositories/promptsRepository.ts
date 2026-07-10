import type { Prompt } from "@shared/types/prompt";
import { createRepository, getAllByIndex } from "../createRepository";
import type { Repository } from "../createRepository";
import { STORES } from "../db";

export interface PromptsRepository extends Repository<Prompt> {
  getByProjectId(projectId: string): Promise<Prompt[]>;
}

export function createPromptsRepository(): PromptsRepository {
  return {
    ...createRepository<Prompt>(STORES.prompts),
    getByProjectId: (projectId) => getAllByIndex(STORES.prompts, "projectId", projectId),
  };
}
