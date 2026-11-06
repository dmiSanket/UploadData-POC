import type { ParsedSpreadsheet, RawRow, RowFilter } from "@/lib/types";

export const BLANK_FILTER_LABEL = "(Blank)";
export const COMBINED_SEPARATOR = " · ";

export interface DistinctValueOption {
  value: string;
  count: number;
}

/** Normalizes any cell value into a human-readable string for distinct-value grouping. */
export function formatFilterCell(value: unknown): string {
  if (value === null || value === undefined) return BLANK_FILTER_LABEL;
  const trimmed = String(value).trim();
  return trimmed === "" ? BLANK_FILTER_LABEL : trimmed;
}

/** Builds the lookup key for a row across one or multiple combined columns. */
export function getRowFilterKey(row: RawRow, columns: string[]): string {
  return columns.map((col) => formatFilterCell(row[col])).join(COMBINED_SEPARATOR);
}

/** Human-readable label for a single-column or combined-column filter. */
export function getFilterLabel(columns: string[]): string {
  return columns.join(" + ");
}

/**
 * Extracts all distinct values (or combined column tuples) and their row counts
 * from the given rows, sorted naturally with `(Blank)` last.
 */
export function getDistinctValues(rows: RawRow[], columns: string[]): DistinctValueOption[] {
  if (columns.length === 0) return [];
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = getRowFilterKey(row, columns);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (a.value === BLANK_FILTER_LABEL && b.value !== BLANK_FILTER_LABEL) return 1;
      if (b.value === BLANK_FILTER_LABEL && a.value !== BLANK_FILTER_LABEL) return -1;
      return a.value.localeCompare(b.value, undefined, { numeric: true, sensitivity: "base" });
    });
}

/**
 * Filters `parsed.rows` and `parsed.rowNumbers` in lockstep so original 1-based
 * spreadsheet row numbers are preserved for validation errors and database storage.
 *
 * - Within a single filter: multi-select acts as logical `OR` (`rowKey IN selectedValues`).
 * - Across multiple filters: active filters combine with logical `AND`.
 * - A filter with `selectedValues.length === 0` is treated as inactive (all rows pass).
 */
export function applyRowFilters(
  parsed: ParsedSpreadsheet,
  filters: RowFilter[],
): ParsedSpreadsheet {
  const active = filters
    .filter((f) => f.columns.length > 0 && f.selectedValues.length > 0)
    .map((f) => ({ columns: f.columns, allowed: new Set(f.selectedValues) }));

  if (active.length === 0) return parsed;

  const rows: RawRow[] = [];
  const rowNumbers: number[] = [];

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    const matchesAll = active.every(({ columns, allowed }) =>
      allowed.has(getRowFilterKey(row, columns)),
    );
    if (matchesAll) {
      rows.push(row);
      rowNumbers.push(parsed.rowNumbers[i]);
    }
  }

  return {
    ...parsed,
    rows,
    rowNumbers,
  };
}

/** Drops any filter columns that no longer exist in `headers` (e.g. when a calculated column is removed). */
export function pruneFiltersForHeaders(filters: RowFilter[], headers: string[]): RowFilter[] {
  const headerSet = new Set(headers);
  return filters
    .map((filter) => {
      const nextColumns = filter.columns.filter((col) => headerSet.has(col));
      if (nextColumns.length === filter.columns.length) return filter;
      return { ...filter, columns: nextColumns, selectedValues: [] };
    })
    .filter((filter) => filter.columns.length > 0);
}

