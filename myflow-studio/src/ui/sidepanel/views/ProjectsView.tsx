import { useState } from "react";
import { Badge, Button, Input } from "@ui/components";
import { useProjects } from "@ui/hooks/useProjects";
import { ProjectRow } from "./projects/ProjectRow";
import styles from "./ProjectsView.module.css";

export function ProjectsView() {
  const {
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
  } = useProjects();

  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | undefined>();

  async function handleCreate(): Promise<void> {
    const trimmed = newName.trim();
    if (!trimmed) {
      return;
    }
    setError(undefined);
    await createProject(trimmed);
    setNewName("");
  }

  async function handleImport(file: File): Promise<void> {
    setError(undefined);
    const result = await importProject(file);
    if (!result.ok) {
      setError(result.error);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.createRow}>
        <Input
          aria-label="New project name"
          placeholder="New project name…"
          value={newName}
          onChange={(event) => {
            setNewName(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleCreate();
            }
          }}
        />
        <Button size="sm" disabled={!newName.trim()} onClick={() => void handleCreate()}>
          Create
        </Button>
        <label className={styles.importLabel}>
          Import
          <input
            type="file"
            accept="application/json,.json"
            className={styles.fileInput}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleImport(file);
              }
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.unfiledRow}>
        <div className={styles.unfiledMain}>
          <span className={styles.unfiledName}>Unfiled prompts</span>
          <p className={styles.unfiledMeta}>
            {activeProjectId === null ? <Badge tone="accent">Active</Badge> : null} The default
            workspace — prompts not saved into a project.
          </p>
        </div>
        {activeProjectId !== null ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void openProject(null);
            }}
          >
            Open
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className={styles.loading}>Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className={styles.empty}>
          No saved projects yet. Create one to organize prompts into a separate, exportable set.
        </p>
      ) : (
        <div className={styles.list}>
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              active={project.id === activeProjectId}
              onOpen={() => {
                void openProject(project.id);
              }}
              onSave={() => {
                void saveActiveProject();
              }}
              onRename={(name) => {
                void renameProject(project.id, name);
              }}
              onDuplicate={() => {
                void duplicateProject(project.id);
              }}
              onExport={() => {
                void exportProject(project.id);
              }}
              onDelete={() => {
                void deleteProject(project.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
