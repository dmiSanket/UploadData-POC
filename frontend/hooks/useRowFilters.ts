"use client";

import { useCallback, useMemo, useState } from "react";
import type { ParsedSpreadsheet, RowFilter } from "@/lib/types";
import { applyRowFilters, getFilterLabel, pruneFiltersForHeaders } from "@/lib/utils/rowFilters";

export interface UseRowFiltersResult {
  filters: RowFilter[];
  /** Spreadsheet after all active multi-select row filters are applied. */
  filtered: ParsedSpreadsheet | null;
  /** Number of filters that have at least one selected value. */
  activeCount: number;
  addFilter: (columns: string[], initialValues?: string[]) => string;
  setSelectedValues: (id: string, values: string[]) => void;
  toggleValue: (id: string, value: string) => void;
  removeFilter: (id: string) => void;
  reset: () => void;
}

function newId(): string {
  return `flt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Manages single-column and combined-column multi-select filters over the
 * spreadsheet (including both raw uploaded columns and calculated columns).
 */
export function useRowFilters(source: ParsedSpreadsheet | null): UseRowFiltersResult {
  const [rawFilters, setRawFilters] = useState<RowFilter[]>([]);

  const filters = useMemo(
    () => (source ? pruneFiltersForHeaders(rawFilters, source.headers) : []),
    [rawFilters, source],
  );

  const filtered = useMemo(
    () => (source ? applyRowFilters(source, filters) : null),
    [source, filters],
  );

  const activeCount = useMemo(
    () => filters.filter((f) => f.selectedValues.length > 0).length,
    [filters],
  );

  const addFilter = useCallback((columns: string[], initialValues: string[] = []): string => {
    const cleanCols = Array.from(new Set(columns.map((c) => c.trim()).filter(Boolean)));
    if (cleanCols.length === 0) return "";
    const key = getFilterLabel(cleanCols);
    const id = newId();

    setRawFilters((current) => {
      const existing = current.find((f) => getFilterLabel(f.columns) === key);
      if (existing) {
        return current.map((f) =>
          f.id === existing.id
            ? {
                ...f,
                selectedValues:
                  initialValues.length > 0
                    ? Array.from(new Set([...f.selectedValues, ...initialValues]))
                    : f.selectedValues,
              }
            : f,
        );
      }
      return [...current, { id, columns: cleanCols, selectedValues: initialValues }];
    });

    return id;
  }, []);

  const setSelectedValues = useCallback((id: string, values: string[]) => {
    setRawFilters((current) =>
      current.map((f) => (f.id === id ? { ...f, selectedValues: values } : f)),
    );
  }, []);

  const toggleValue = useCallback((id: string, value: string) => {
    setRawFilters((current) =>
      current.map((f) => {
        if (f.id !== id) return f;
        const exists = f.selectedValues.includes(value);
        const selectedValues = exists
          ? f.selectedValues.filter((v) => v !== value)
          : [...f.selectedValues, value];
        return { ...f, selectedValues };
      }),
    );
  }, []);

  const removeFilter = useCallback((id: string) => {
    setRawFilters((current) => current.filter((f) => f.id !== id));
  }, []);

  const reset = useCallback(() => setRawFilters([]), []);

  return {
    filters,
    filtered,
    activeCount,
    addFilter,
    setSelectedValues,
    toggleValue,
    removeFilter,
    reset,
  };
}

