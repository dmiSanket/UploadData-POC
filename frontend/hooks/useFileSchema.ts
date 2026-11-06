"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/services/apiClient";
import { schemaService } from "@/lib/services/schemaService";
import type { ColumnInput, FileSchemaDetail, SavedMappingConfig } from "@/lib/types";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export interface UseFileSchemaResult {
  schema: FileSchemaDetail | null;
  /** True when the lookup succeeded with "no schema yet" (HTTP 404). */
  missing: boolean;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createSchema: () => Promise<boolean>;
  /** Resolves true when the schema was deleted. */
  deleteSchema: () => Promise<boolean>;
  saveMapping: (config: Omit<SavedMappingConfig, "updatedAt">) => Promise<boolean>;
  clearMapping: () => Promise<boolean>;
  addColumn: (input: ColumnInput) => Promise<string | null>;
  updateColumn: (columnId: number, input: ColumnInput) => Promise<string | null>;
  removeColumn: (columnId: number) => Promise<boolean>;
}

/** Loads and mutates the file schema for a category + scope pair. */
export function useFileSchema(
  categoryId: number | null,
  scopeId: number | null,
  /** Called after any successful mutation so callers can refresh related lists. */
  onMutated?: () => void,
): UseFileSchemaResult {
  const [schema, setSchema] = useState<FileSchemaDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (categoryId === null || scopeId === null) {
      setSchema(null);
      setMissing(false);
      return;
    }
    setLoading(true);
    try {
      setSchema(await schemaService.lookup(categoryId, scopeId));
      setMissing(false);
      setError(null);
    } catch (err) {
      setSchema(null);
      if (err instanceof ApiError && err.status === 404) {
        setMissing(true);
        setError(null);
      } else {
        setMissing(false);
        setError(messageOf(err));
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId, scopeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when selection changes
    void load();
  }, [load]);

  const guarded = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action();
        await load();
        onMutated?.();
        return true;
      } catch (err) {
        setError(messageOf(err));
        return false;
      }
    },
    [load, onMutated],
  );

  // Column mutations return the error message so the form can show it inline.
  const columnMutation = useCallback(
    async (action: () => Promise<unknown>): Promise<string | null> => {
      try {
        await action();
        await load();
        onMutated?.();
        return null;
      } catch (err) {
        return messageOf(err);
      }
    },
    [load, onMutated],
  );

  return {
    schema,
    missing,
    loading,
    error,
    reload: load,
    createSchema: () =>
      guarded(() => schemaService.create(categoryId as number, scopeId as number)),
    deleteSchema: () => guarded(() => schemaService.remove((schema as FileSchemaDetail).id)),
    saveMapping: (config) =>
      guarded(() => schemaService.saveMapping((schema as FileSchemaDetail).id, config)),
    clearMapping: () =>
      guarded(() => schemaService.clearMapping((schema as FileSchemaDetail).id)),
    addColumn: (input) =>
      columnMutation(() => schemaService.addColumn((schema as FileSchemaDetail).id, input)),
    updateColumn: (columnId, input) =>
      columnMutation(() => schemaService.updateColumn(columnId, input)),
    removeColumn: (columnId) => guarded(() => schemaService.removeColumn(columnId)),
  };
}

