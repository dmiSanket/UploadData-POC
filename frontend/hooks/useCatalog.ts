"use client";

import { useCallback, useEffect, useState } from "react";
import { catalogService, type CatalogKind } from "@/lib/services/catalogService";
import type { NamedEntity } from "@/lib/types";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export interface UseCatalogResult {
  items: NamedEntity[];
  loading: boolean;
  error: string | null;
  add: (name: string) => Promise<boolean>;
  rename: (id: number, name: string) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

/** Loads a catalog (categories or scopes) and exposes add/rename/remove actions. */
export function useCatalog(kind: CatalogKind): UseCatalogResult {
  const [items, setItems] = useState<NamedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setItems(await catalogService.list(kind));
      setError(null);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void reload();
  }, [reload]);

  // Wraps a mutation: reports the error, reloads on success, returns whether it worked.
  const mutate = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action();
        await reload();
        return true;
      } catch (err) {
        setError(messageOf(err));
        return false;
      }
    },
    [reload],
  );

  return {
    items,
    loading,
    error,
    add: (name) => mutate(() => catalogService.create(kind, name)),
    rename: (id, name) => mutate(() => catalogService.update(kind, id, name)),
    remove: (id) => mutate(() => catalogService.remove(kind, id)),
  };
}

