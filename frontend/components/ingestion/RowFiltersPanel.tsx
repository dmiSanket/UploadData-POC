"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Calculator, Filter, Layers, Plus, RotateCcw } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import type { ParsedSpreadsheet, RowFilter } from "@/lib/types";
import { getDistinctValues, getFilterLabel } from "@/lib/utils/rowFilters";
import { RowFilterItem } from "./RowFilterItem";

interface RowFiltersPanelProps {
  /** Spreadsheet with calculated columns included (pre-filter). */
  source: ParsedSpreadsheet;
  /** Spreadsheet after active filters are applied. */
  filtered: ParsedSpreadsheet;
  filters: RowFilter[];
  calculatedNames: string[];
  onAddFilter: (columns: string[], initialValues?: string[]) => string;
  onToggleValue: (id: string, value: string) => void;
  onSetValues: (id: string, values: string[]) => void;
  onRemoveFilter: (id: string) => void;
  onReset: () => void;
}

/** Panel for filtering spreadsheet rows by distinct single-column or combined-column values. */
export function RowFiltersPanel({
  source,
  filtered,
  filters,
  calculatedNames,
  onAddFilter,
  onToggleValue,
  onSetValues,
  onRemoveFilter,
  onReset,
}: RowFiltersPanelProps) {
  const [selectedCols, setSelectedCols] = useState<string[]>([]);

  const toggleColumn = (header: string) => {
    setSelectedCols((current) =>
      current.includes(header) ? current.filter((c) => c !== header) : [...current, header],
    );
  };

  const pendingLabel = getFilterLabel(selectedCols);
  const existingFilter = useMemo(
    () => filters.find((f) => getFilterLabel(f.columns) === pendingLabel) ?? null,
    [filters, pendingLabel],
  );

  const previewDistinct = useMemo(
    () => (selectedCols.length > 0 && !existingFilter ? getDistinctValues(source.rows, selectedCols) : []),
    [selectedCols, existingFilter, source.rows],
  );

  const isFiltering = filtered.rows.length !== source.rows.length;

  const commitFilter = (initialValues: string[] = []) => {
    if (selectedCols.length === 0) return;
    onAddFilter(selectedCols, initialValues);
    setSelectedCols([]);
  };

  return (
    <Card
      label="Optional"
      icon={<Filter className="h-4 w-4" />}
      title="Filter rows by column values"
      description="Select a column (e.g. Dealer) or combine multiple columns (including calculated columns) to view their distinct values and multi-select which rows should be inserted into the backend."
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={filtered.rows.length === 0 ? "amber" : isFiltering ? "emerald" : "neutral"}>
            Keeping {filtered.rows.length} of {source.rows.length} rows
          </Badge>
          {filters.length > 0 && (
            <Button size="sm" variant="ghost" onClick={onReset}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
            </Button>
          )}
        </div>
      }
    >
      <div data-testid="row-filters-builder" className="rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-zinc-700">
            1. Pick a column — or click multiple columns to filter on their{" "}
            <span className="font-semibold text-brand-700">combined values</span>:
          </p>
          {selectedCols.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCols([])}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Clear column selection
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {source.headers.map((header) => {
            const active = selectedCols.includes(header);
            const isCalc = calculatedNames.includes(header);
            const order = selectedCols.indexOf(header);
            return (
              <button
                key={header}
                type="button"
                onClick={() => toggleColumn(header)}
                aria-pressed={active}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-medium transition-colors",
                  active
                    ? "border-brand-600 bg-brand-600 text-white shadow-2xs"
                    : isCalc
                      ? "border-brand-200 bg-brand-50/70 text-brand-700 hover:border-brand-400"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-brand-300 hover:bg-brand-50/40",
                )}
              >
                {isCalc && <Calculator className="h-3 w-3" aria-label="Calculated column" />}
                {header}
                {active && selectedCols.length > 1 && (
                  <span className="rounded-full bg-white/25 px-1.5 text-[10px]">{order + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {selectedCols.length > 0 && !existingFilter && (
          <div className="mt-3 rounded-lg border border-brand-200/80 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                {selectedCols.length > 1 && <Layers className="h-3.5 w-3.5 text-brand-600" />}
                <span>
                  2. Click distinct values of{" "}
                  <span className="font-mono font-semibold text-zinc-900">{pendingLabel}</span>{" "}
                  ({previewDistinct.length} distinct) to multi-select:
                </span>
              </p>
              <Button size="sm" variant="soft" onClick={() => commitFilter()}>
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add {selectedCols.length > 1 ? "combined " : ""}filter
              </Button>
            </div>
            <div className="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
              {previewDistinct.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => commitFilter([opt.value])}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                >
                  <span className="max-w-52 truncate">{opt.value}</span>
                  <span className="rounded-full bg-zinc-200/80 px-1.5 text-[10px] tabular-nums text-zinc-600">
                    {opt.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {filters.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {filters.map((filter) => (
            <RowFilterItem
              key={filter.id}
              filter={filter}
              sourceRows={source.rows}
              calculatedNames={calculatedNames}
              onToggleValue={onToggleValue}
              onSetValues={onSetValues}
              onRemove={onRemoveFilter}
            />
          ))}
        </div>
      )}

      {filtered.rows.length === 0 && (
        <Alert tone="error" className="mt-3">
          No rows match the current filter combination. Clear or adjust the selected values before continuing.
        </Alert>
      )}
    </Card>
  );
}
