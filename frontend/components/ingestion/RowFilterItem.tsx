"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Calculator, Check, Layers, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { IconButton } from "@/components/shared/Button";
import type { RawRow, RowFilter } from "@/lib/types";
import { getDistinctValues, getFilterLabel } from "@/lib/utils/rowFilters";

interface RowFilterItemProps {
  filter: RowFilter;
  sourceRows: RawRow[];
  calculatedNames: string[];
  onToggleValue: (id: string, value: string) => void;
  onSetValues: (id: string, values: string[]) => void;
  onRemove: (id: string) => void;
}

/** Displays a single or combined-column filter with searchable multi-select distinct values. */
export function RowFilterItem({
  filter,
  sourceRows,
  calculatedNames,
  onToggleValue,
  onSetValues,
  onRemove,
}: RowFilterItemProps) {
  const [search, setSearch] = useState("");

  const distinctOptions = useMemo(
    () => getDistinctValues(sourceRows, filter.columns),
    [sourceRows, filter.columns],
  );

  const visibleOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return distinctOptions;
    return distinctOptions.filter((opt) => opt.value.toLowerCase().includes(q));
  }, [distinctOptions, search]);

  const selectedSet = useMemo(() => new Set(filter.selectedValues), [filter.selectedValues]);
  const isCombined = filter.columns.length > 1;
  const hasCalculated = filter.columns.some((col) => calculatedNames.includes(col));
  const label = getFilterLabel(filter.columns);

  return (
    <div
      data-testid={`row-filter-${label}`}
      className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-zinc-900">
            {isCombined && <Layers className="h-3.5 w-3.5 text-brand-600" aria-label="Combined columns" />}
            {hasCalculated && <Calculator className="h-3.5 w-3.5 text-brand-600" aria-label="Calculated column" />}
            {label}
          </span>
          {isCombined && <Badge tone="brand">Combined ({filter.columns.length} cols)</Badge>}
          <Badge tone={filter.selectedValues.length > 0 ? "emerald" : "neutral"}>
            {filter.selectedValues.length > 0
              ? `${filter.selectedValues.length} of ${distinctOptions.length} selected`
              : `All ${distinctOptions.length} distinct values`}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onSetValues(filter.id, distinctOptions.map((o) => o.value))}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Select all
          </button>
          <span className="text-zinc-300">·</span>
          <button
            type="button"
            onClick={() => onSetValues(filter.id, [])}
            className="font-medium text-zinc-500 hover:text-zinc-800"
          >
            Clear
          </button>
          <IconButton aria-label={`Remove filter ${label}`} onClick={() => onRemove(filter.id)}>
            <Trash2 className="h-4 w-4 text-rose-500" />
          </IconButton>
        </div>
      </div>

      {distinctOptions.length > 6 && (
        <div className="relative mt-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${distinctOptions.length} distinct values in ${label}…`}
            className="h-7 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-2.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>
      )}

      <div className="mt-2.5 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto pt-0.5">
        {visibleOptions.map((option) => {
          const active = selectedSet.has(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggleValue(filter.id, option.value)}
              aria-pressed={active}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-brand-600 bg-brand-600 text-white shadow-2xs"
                  : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:border-brand-300 hover:bg-brand-50/50",
              )}
            >
              <span
                className={clsx(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-xs border",
                  active ? "border-white bg-white/20 text-white" : "border-zinc-300 bg-white",
                )}
              >
                {active && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </span>
              <span className="max-w-52 truncate">{option.value}</span>
              <span
                className={clsx(
                  "rounded-full px-1.5 py-0.2 text-[10px] tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-zinc-200/80 text-zinc-600",
                )}
              >
                {option.count}
              </span>
            </button>
          );
        })}
        {visibleOptions.length === 0 && (
          <p className="py-1 text-xs text-zinc-400">No distinct values match &ldquo;{search}&rdquo;.</p>
        )}
      </div>
    </div>
  );
}

