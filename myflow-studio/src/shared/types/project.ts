/**
 * Deliberately minimal for now — settings/reference bundling and recent-
 * projects metadata arrive with M10 (projects), extending this record.
 */
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}
