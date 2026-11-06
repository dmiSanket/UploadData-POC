"use client";

import { useCallback, useMemo, useState } from "react";
import type { ComputedColumn, MappingDictionary, ParsedSpreadsheet } from "@/lib/types";
import { applyComputedColumns, removeComputedColumn } from "@/lib/utils/computedColumns";

type MappingUpdater = (update: (current: MappingDictionary) => MappingDictionary) => void;

export interface UseComputedColumnsResult {
  computed: ComputedColumn[];
  /** The parsed file with every calculated column appended as a normal column. */
  effective: ParsedSpreadsheet | null;
  /** Adds a column and, when `targetColumn` is given, maps it to that system column. */
  add: (column: Omit<ComputedColumn, "id">, targetColumn: string | null) => void;
  remove: (id: string) => void;
  setAll: (columns: ComputedColumn[]) => void;
  reset: () => void;
}

function newId(): string {
  // crypto.randomUUID needs a secure context, which a LAN IP does not provide.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Holds the calculated-column definitions for the uploaded file and exposes the
 * resulting spreadsheet, so mapping and submit treat them like any other column.
 */
export function useComputedColumns(
  parsed: ParsedSpreadsheet | null,
  updateMapping: MappingUpdater,
): UseComputedColumnsResult {
  const [computed, setComputed] = useState<ComputedColumn[]>([]);

  const effective = useMemo(
    () => (parsed ? applyComputedColumns(parsed, computed) : null),
    [parsed, computed],
  );

  const add = useCallback(
    (column: Omit<ComputedColumn, "id">, targetColumn: string | null) => {
      setComputed((current) => [...current, { ...column, id: newId() }]);
      if (targetColumn) updateMapping((current) => ({ ...current, [targetColumn]: column.name }));
    },
    [updateMapping],
  );

  const remove = useCallback(
    (id: string) => {
      const { remaining, removedNames } = removeComputedColumn(computed, id);
      setComputed(remaining);
      // Clear any mapping that pointed at a column that no longer exists.
      updateMapping((current) =>
        Object.fromEntries(
          Object.entries(current).map(([system, header]) => [
            system,
            removedNames.includes(header) ? "" : header,
          ]),
        ),
      );
    },
    [computed, updateMapping],
  );

  const setAll = useCallback((columns: ComputedColumn[]) => setComputed(columns), []);

  const reset = useCallback(() => setComputed([]), []);

  return { computed, effective, add, remove, setAll, reset };
}

