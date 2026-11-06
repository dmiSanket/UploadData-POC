"use client";

import { useCallback, useEffect, useState } from "react";
import { schemaService } from "@/lib/services/schemaService";
import type { FileSchemaSummary } from "@/lib/types";

export interface UseSchemaListResult {
  schemas: FileSchemaSummary[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/** Lists every Category + Scope schema (with column counts) for the layers panel. */
export function useSchemaList(): UseSchemaListResult {
  const [schemas, setSchemas] = useState<FileSchemaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setSchemas(await schemaService.list());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load schemas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void reload();
  }, [reload]);

  return { schemas, loading, error, reload };
}

