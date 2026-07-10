import { useMemo, useState } from "react";
import { Button, Input, Select } from "@ui/components";
import { usePrompts } from "@ui/hooks/usePrompts";
import { useGenerationSettings } from "@ui/hooks/useGenerationSettings";
import { computePromptStats } from "@shared/utils/promptStats";
import type { PromptSortMode } from "@shared/utils/promptOrdering";
import { StatsBar } from "./prompts/StatsBar";
import { PromptRow } from "./prompts/PromptRow";
import { PromptEditorModal } from "./prompts/PromptEditorModal";
import { ImportPanel } from "./prompts/ImportPanel";
import { BulkActionsBar } from "./prompts/BulkActionsBar";
import { ReferenceLibraryPanel } from "./prompts/ReferenceLibraryPanel";
import styles from "./PromptsView.module.css";

const SORT_OPTIONS: { value: PromptSortMode; label: string }[] = [
  { value: "manual", label: "Manual order" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];

export function PromptsView() {
  const {
    prompts,
    allPrompts,
    loading,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    selectedIds,
    toggleSelected,
    clearSelection,
    addPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
    moveUp,
    moveDown,
    importPrompts,
    bulkDelete,
    bulkFindReplace,
  } = usePrompts();
  const [settings] = useGenerationSettings();
  const stats = useMemo(
    () => computePromptStats(allPrompts, settings.imagesPerPrompt),
    [allPrompts, settings.imagesPerPrompt],
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const editingPrompt = editingId ? (allPrompts.find((p) => p.id === editingId) ?? null) : null;
  const showReorder = sortMode === "manual" && searchQuery.trim().length === 0;

  function openNewEditor(): void {
    setEditingId(null);
    setEditorOpen(true);
  }

  function openEditEditor(id: string): void {
    setEditingId(id);
    setEditorOpen(true);
  }

  async function handleSave(
    text: string,
    variables: Record<string, string> | undefined,
    referenceImageIds: string[] | undefined,
  ): Promise<void> {
    if (editingId) {
      await updatePrompt(editingId, { text, variables, referenceImageIds });
    } else {
      await addPrompt(text, variables, referenceImageIds);
    }
  }

  return (
    <div className={styles.wrap}>
      <StatsBar stats={stats} />

      <div className={styles.toolbar}>
        <Input
          placeholder="Search prompts…"
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
          }}
        />
        <Select
          aria-label="Sort prompts"
          value={sortMode}
          onChange={(event) => {
            setSortMode(event.target.value as PromptSortMode);
          }}
          options={SORT_OPTIONS}
        />
      </div>

      <div className={styles.toolbarActions}>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => {
            setImportOpen(true);
          }}
        >
          Import
        </Button>
        <Button size="sm" fullWidth onClick={openNewEditor}>
          Add prompt
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={styles.referencesButton}
          onClick={() => {
            setLibraryOpen(true);
          }}
        >
          References
        </Button>
      </div>

      {selectedIds.size > 0 ? (
        <BulkActionsBar
          count={selectedIds.size}
          onClear={clearSelection}
          onDelete={() => {
            void bulkDelete(selectedIds);
          }}
          onFindReplace={(find, replace) => {
            void bulkFindReplace(selectedIds, find, replace);
          }}
        />
      ) : null}

      {loading ? (
        <p className={styles.loading}>Loading prompts…</p>
      ) : prompts.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {allPrompts.length === 0 ? "No prompts yet" : "No prompts match your search"}
          </p>
          {allPrompts.length === 0 ? (
            <>
              <p className={styles.emptyHint}>
                Import a TXT, CSV, or JSON file, or add your first prompt directly.
              </p>
              <div className={styles.emptyActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setImportOpen(true);
                  }}
                >
                  Import
                </Button>
                <Button size="sm" onClick={openNewEditor}>
                  Add prompt
                </Button>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className={styles.list}>
          {prompts.map((prompt, index) => (
            <PromptRow
              key={prompt.id}
              prompt={prompt}
              index={index}
              selected={selectedIds.has(prompt.id)}
              showReorder={showReorder}
              canMoveUp={index > 0}
              canMoveDown={index < prompts.length - 1}
              onToggleSelected={() => {
                toggleSelected(prompt.id);
              }}
              onEdit={() => {
                openEditEditor(prompt.id);
              }}
              onDuplicate={() => {
                void duplicatePrompt(prompt.id);
              }}
              onDelete={() => {
                void deletePrompt(prompt.id);
              }}
              onMoveUp={() => {
                void moveUp(prompt.id);
              }}
              onMoveDown={() => {
                void moveDown(prompt.id);
              }}
            />
          ))}
        </div>
      )}

      <PromptEditorModal
        open={editorOpen}
        initialText={editingPrompt?.text ?? ""}
        initialVariables={editingPrompt?.variables}
        initialReferenceImageIds={editingPrompt?.referenceImageIds}
        onClose={() => {
          setEditorOpen(false);
        }}
        onSave={(text, variables, referenceImageIds) => {
          void handleSave(text, variables, referenceImageIds);
        }}
      />

      <ImportPanel
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
        }}
        onImport={(parsed) => {
          void importPrompts(parsed);
        }}
      />

      <ReferenceLibraryPanel
        open={libraryOpen}
        onClose={() => {
          setLibraryOpen(false);
        }}
      />
    </div>
  );
}
