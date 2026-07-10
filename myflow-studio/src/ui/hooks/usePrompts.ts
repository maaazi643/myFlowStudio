import { useCallback, useEffect, useMemo, useState } from "react";
import { createPromptsRepository } from "@shared/storage/indexedDb/repositories";
import type { Prompt } from "@shared/types/prompt";
import type { ParsedPrompt } from "@shared/utils/parsers";
import { filterPromptsByQuery, nextOrderValue, sortPrompts } from "@shared/utils/promptOrdering";
import type { PromptSortMode } from "@shared/utils/promptOrdering";

const repo = createPromptsRepository();

export interface UsePromptsResult {
  /** Filtered by search and sorted by the active sort mode. */
  prompts: Prompt[];
  /** Unfiltered — for stats that should reflect the whole set. */
  allPrompts: Prompt[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortMode: PromptSortMode;
  setSortMode: (mode: PromptSortMode) => void;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  selectAllVisible: () => void;
  addPrompt: (
    text: string,
    variables?: Record<string, string>,
    referenceImageIds?: string[],
  ) => Promise<void>;
  updatePrompt: (
    id: string,
    patch: {
      text: string;
      variables?: Record<string, string> | undefined;
      referenceImageIds?: string[] | undefined;
    },
  ) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicatePrompt: (id: string) => Promise<void>;
  moveUp: (id: string) => Promise<void>;
  moveDown: (id: string) => Promise<void>;
  importPrompts: (parsed: ParsedPrompt[]) => Promise<void>;
  bulkDelete: (ids: Set<string>) => Promise<void>;
  bulkFindReplace: (ids: Set<string>, find: string, replace: string) => Promise<void>;
}

export function usePrompts(): UsePromptsResult {
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<PromptSortMode>("manual");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    void repo.getAll().then((loaded) => {
      if (!cancelled) {
        setAllPrompts(loaded);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const prompts = useMemo(
    () => sortPrompts(filterPromptsByQuery(allPrompts, searchQuery), sortMode),
    [allPrompts, searchQuery, sortMode],
  );

  const addPrompt = useCallback(
    async (text: string, variables?: Record<string, string>, referenceImageIds?: string[]) => {
      const now = Date.now();
      const prompt: Prompt = {
        id: crypto.randomUUID(),
        projectId: null,
        text,
        variables,
        referenceImageIds,
        order: nextOrderValue(allPrompts),
        createdAt: now,
        updatedAt: now,
      };
      await repo.put(prompt);
      setAllPrompts((current) => [...current, prompt]);
    },
    [allPrompts],
  );

  const updatePrompt = useCallback(
    async (id: string, patch: { text: string; variables?: Record<string, string> | undefined }) => {
      const existing = allPrompts.find((prompt) => prompt.id === id);
      if (!existing) {
        return;
      }
      const updated: Prompt = { ...existing, ...patch, updatedAt: Date.now() };
      await repo.put(updated);
      setAllPrompts((current) => current.map((prompt) => (prompt.id === id ? updated : prompt)));
    },
    [allPrompts],
  );

  const deletePrompt = useCallback(async (id: string) => {
    await repo.delete(id);
    setAllPrompts((current) => current.filter((prompt) => prompt.id !== id));
    setSelectedIds((current) => {
      if (!current.has(id)) {
        return current;
      }
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const duplicatePrompt = useCallback(
    async (id: string) => {
      const original = allPrompts.find((prompt) => prompt.id === id);
      if (!original) {
        return;
      }
      const now = Date.now();
      const copy: Prompt = {
        ...original,
        id: crypto.randomUUID(),
        order: nextOrderValue(allPrompts),
        createdAt: now,
        updatedAt: now,
      };
      await repo.put(copy);
      setAllPrompts((current) => [...current, copy]);
    },
    [allPrompts],
  );

  const moveBy = useCallback(
    async (id: string, direction: -1 | 1) => {
      const manualOrder = sortPrompts(allPrompts, "manual");
      const index = manualOrder.findIndex((prompt) => prompt.id === id);
      const swapIndex = index + direction;
      if (index === -1 || swapIndex < 0 || swapIndex >= manualOrder.length) {
        return;
      }
      const current = manualOrder[index];
      const neighbor = manualOrder[swapIndex];
      if (!current || !neighbor) {
        return;
      }
      const now = Date.now();
      const updatedCurrent: Prompt = { ...current, order: neighbor.order, updatedAt: now };
      const updatedNeighbor: Prompt = { ...neighbor, order: current.order, updatedAt: now };
      await Promise.all([repo.put(updatedCurrent), repo.put(updatedNeighbor)]);
      setAllPrompts((prev) =>
        prev.map((prompt) => {
          if (prompt.id === updatedCurrent.id) {
            return updatedCurrent;
          }
          if (prompt.id === updatedNeighbor.id) {
            return updatedNeighbor;
          }
          return prompt;
        }),
      );
    },
    [allPrompts],
  );

  const moveUp = useCallback((id: string) => moveBy(id, -1), [moveBy]);
  const moveDown = useCallback((id: string) => moveBy(id, 1), [moveBy]);

  const importPrompts = useCallback(
    async (parsed: ParsedPrompt[]) => {
      const now = Date.now();
      let order = nextOrderValue(allPrompts);
      const newPrompts: Prompt[] = parsed.map((item) => ({
        id: crypto.randomUUID(),
        projectId: null,
        text: item.text,
        variables: item.variables,
        order: order++,
        createdAt: now,
        updatedAt: now,
      }));
      await Promise.all(newPrompts.map((prompt) => repo.put(prompt)));
      setAllPrompts((current) => [...current, ...newPrompts]);
    },
    [allPrompts],
  );

  const bulkDelete = useCallback(async (ids: Set<string>) => {
    await Promise.all([...ids].map((id) => repo.delete(id)));
    setAllPrompts((current) => current.filter((prompt) => !ids.has(prompt.id)));
    setSelectedIds(new Set());
  }, []);

  const bulkFindReplace = useCallback(
    async (ids: Set<string>, find: string, replace: string) => {
      if (!find) {
        return;
      }
      const now = Date.now();
      const updated = allPrompts
        .filter((prompt) => ids.has(prompt.id))
        .map((prompt) => ({
          ...prompt,
          text: prompt.text.split(find).join(replace),
          updatedAt: now,
        }));
      await Promise.all(updated.map((prompt) => repo.put(prompt)));
      const byId = new Map(updated.map((prompt) => [prompt.id, prompt]));
      setAllPrompts((current) => current.map((prompt) => byId.get(prompt.id) ?? prompt));
    },
    [allPrompts],
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(prompts.map((prompt) => prompt.id)));
  }, [prompts]);

  return {
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
    selectAllVisible,
    addPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
    moveUp,
    moveDown,
    importPrompts,
    bulkDelete,
    bulkFindReplace,
  };
}
