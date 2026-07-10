import type { Project } from "@shared/types/project";
import { createRepository } from "../createRepository";
import type { Repository } from "../createRepository";
import { STORES } from "../db";

export type ProjectsRepository = Repository<Project>;

export function createProjectsRepository(): ProjectsRepository {
  return createRepository<Project>(STORES.projects);
}
