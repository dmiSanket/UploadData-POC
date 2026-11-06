import { ArrowRight, Calculator, Columns3, Filter, Sparkles } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import type {
  ColumnDefinition,
  ComputedColumn,
  DefaultValuesDictionary,
  MappingDictionary,
  RowFilter,
} from "@/lib/types";
import { getFilterLabel } from "@/lib/utils/rowFilters";

interface ChangesSummaryPanelProps {
  columns: ColumnDefinition[];
  mapping: MappingDictionary;
  defaultValues: DefaultValuesDictionary;
  computed: ComputedColumn[];
  filters: RowFilter[];
  addedSystemColumns: string[];
  filteredRowCount: number;
  totalUploadedRows?: number;
}

/** Summarizes all transformations, filters, calculated columns, and default values before upload. */
export function ChangesSummaryPanel({
  columns,
  mapping,
  defaultValues,
  computed,
  filters,
  addedSystemColumns,
  filteredRowCount,
  totalUploadedRows,
}: ChangesSummaryPanelProps) {
  const activeFilters = filters.filter((f) => f.selectedValues.length > 0);
  const activeDefaults = Object.entries(defaultValues).filter(([, val]) => val.trim() !== "");
  const calcNames = new Set(computed.map((c) => c.name.trim()));

  return (
    <div data-testid="changes-summary-panel" className="mt-5 space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Summary of all changes & transformations
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {/* Row Filters */}
          <div className="rounded-lg border border-zinc-200/80 bg-white p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
              <Filter className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              <span>Row filters ({activeFilters.length})</span>
            </div>
            {activeFilters.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                {activeFilters.map((f) => (
                  <li key={f.id} className="truncate">
                    <span className="font-mono font-medium text-zinc-900">
                      {getFilterLabel(f.columns)}
                    </span>
                    : {f.selectedValues.join(", ")}
                  </li>
                ))}
                <li className="pt-0.5 font-medium text-emerald-700">
                  Keeping {filteredRowCount} of {totalUploadedRows ?? filteredRowCount} rows
                </li>
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-400">
                No filters — all {filteredRowCount} rows included.
              </p>
            )}
          </div>

          {/* Calculated Columns */}
          <div className="rounded-lg border border-zinc-200/80 bg-white p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
              <Calculator className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              <span>Calculated columns ({computed.length})</span>
            </div>
            {computed.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                {computed.map((c) => (
                  <li key={c.id} className="truncate font-mono">
                    <span className="font-semibold text-brand-700">{c.name}</span> = {c.formula}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-400">None created.</p>
            )}
          </div>

          {/* New System Columns & Custom Defaults */}
          <div className="rounded-lg border border-zinc-200/80 bg-white p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
              <Columns3 className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              <span>
                New columns & defaults ({addedSystemColumns.length + activeDefaults.length})
              </span>
            </div>
            {addedSystemColumns.length > 0 || activeDefaults.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                {addedSystemColumns.map((colName) => (
                  <li key={`new-${colName}`} className="truncate">
                    <Badge tone="brand">New column</Badge>{" "}
                    <span className="font-mono font-medium text-zinc-900">{colName}</span>
                  </li>
                ))}
                {activeDefaults.map(([colName, val]) => (
                  <li key={`def-${colName}`} className="truncate">
                    <span className="font-mono font-medium text-zinc-900">{colName}</span> default:{" "}
                    <span className="font-mono font-semibold text-emerald-700">
                      &ldquo;{val.trim()}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-400">No custom defaults or new columns.</p>
            )}
          </div>
        </div>
      </div>

      {/* Column Mapping Breakdown */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Column mapping & value sources
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {columns.map((col) => {
            const header = mapping[col.columnName]?.trim() ?? "";
            const defVal = defaultValues[col.columnName]?.trim() ?? "";
            const isCalc = header !== "" && calcNames.has(header);
            return (
              <li
                key={col.id}
                className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-1.5 truncate">
                  {header ? (
                    <span className="inline-flex items-center gap-1 truncate text-zinc-700">
                      {isCalc && <Calculator className="h-3.5 w-3.5 shrink-0 text-brand-600" />}
                      <span className="truncate">{header}</span>
                      {defVal && (
                        <span className="text-xs text-emerald-700">(fallback: &ldquo;{defVal}&rdquo;)</span>
                      )}
                    </span>
                  ) : defVal ? (
                    <span className="inline-flex items-center gap-1 truncate text-emerald-700">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span>Default: &ldquo;{defVal}&rdquo;</span>
                    </span>
                  ) : (
                    <span className="italic text-zinc-400">Unmapped (null)</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                  <span className="font-mono font-semibold text-zinc-900">{col.columnName}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

