"use client";

import { useCallback, useEffect, useState } from "react";
import { scopeService } from "@/lib/services/catalogService";
import type { ScopeEntity, ScopeInput } from "@/lib/types";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export interface UseScopesResult {
  scopes: ScopeEntity[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  create: (input: ScopeInput) => Promise<ScopeEntity | null>;
  update: (id: number, input: ScopeInput) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

/** Loads and mutates composite Scopes (combining Dealers, Locations, and Brands). */
export function useScopes(): UseScopesResult {
  const [scopes, setScopes] = useState<ScopeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setScopes(await scopeService.list());
      setError(null);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void reload();
  }, [reload]);

  const create = useCallback(
    async (input: ScopeInput): Promise<ScopeEntity | null> => {
      try {
        const created = await scopeService.create(input);
        await reload();
        return created;
      } catch (err) {
        setError(messageOf(err));
        return null;
      }
    },
    [reload],
  );

  const update = useCallback(
    async (id: number, input: ScopeInput): Promise<boolean> => {
      try {
        await scopeService.update(id, input);
        await reload();
        return true;
      } catch (err) {
        setError(messageOf(err));
        return false;
      }
    },
    [reload],
  );

  const remove = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await scopeService.remove(id);
        await reload();
        return true;
      } catch (err) {
        setError(messageOf(err));
        return false;
      }
    },
    [reload],
  );

  return { scopes, loading, error, reload, create, update, remove };
}

