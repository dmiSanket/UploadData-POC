import clsx from "clsx";
import { ArrowDown, ArrowRight, Check, Sparkles } from "lucide-react";
import { Badge, DataTypeBadge } from "@/components/shared/Badge";
import { INPUT_CLASSES, SELECT_CLASSES } from "@/components/shared/Field";
import type { ColumnDefinition, RawRow } from "@/lib/types";
import { describeRules } from "@/lib/utils/columnForm";

interface MappingRowProps {
  column: ColumnDefinition;
  headers: string[];
  selected: string;
  defaultValue: string;
  isNewColumn?: boolean;
  calculatedNames?: string[];
  rows: RawRow[];
  onChange: (columnName: string, header: string) => void;
  onDefaultChange: (columnName: string, defaultValue: string) => void;
}

function firstSample(rows: RawRow[], header: string): string | null {
  for (const row of rows) {
    const value = row[header];
    if (value !== null && value !== undefined && value !== "") return String(value);
  }
  return null;
}

export function MappingRow({
  column,
  headers,
  selected,
  defaultValue,
  isNewColumn = false,
  calculatedNames = [],
  rows,
  onChange,
  onDefaultChange,
}: MappingRowProps) {
  const selectId = `map-${column.id}`;
  const defaultId = `def-${column.id}`;
  const sample = selected ? firstSample(rows, selected) : null;
  const hasDefault = defaultValue.trim() !== "";
  const isResolved = Boolean(selected || hasDefault);
  const unresolved = column.isRequired && !isResolved;
  const rules = describeRules(column.validationRules);

  return (
    <li className="grid items-center gap-2 py-3.5 md:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1.25fr)] md:gap-3">
      {/* System column (left) */}
      <div
        className={clsx(
          "rounded-xl border bg-white p-3 transition-colors",
          unresolved
            ? "border-rose-200 bg-rose-50/40"
            : isResolved
              ? "border-emerald-200"
              : "border-zinc-200",
        )}
      >
        <label htmlFor={selectId} className="flex flex-wrap items-center gap-1.5 font-mono text-sm font-semibold text-zinc-900">
          <span>
            {column.columnName}
            {column.isRequired && (
              <span className="text-rose-600" aria-hidden>
                *
              </span>
            )}
          </span>
          {isNewColumn && (
            <Badge tone="brand">
              <Sparkles className="mr-1 h-2.5 w-2.5" aria-hidden /> New column
            </Badge>
          )}
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <DataTypeBadge dataType={column.dataType} />
          <Badge tone={column.isRequired ? "required" : "optional"}>
            {column.isRequired ? "Mandatory" : "Optional"}
          </Badge>
          {hasDefault && (
            <Badge tone="emerald">
              Default: &ldquo;{defaultValue.trim()}&rdquo;
            </Badge>
          )}
          {rules !== "—" && <span className="text-xs text-zinc-500">{rules}</span>}
        </div>
      </div>

      {/* Connector */}
      <div className="flex justify-center" aria-hidden>
        <span
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            isResolved ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400",
          )}
        >
          {isResolved ? (
            <Check className="h-4 w-4" />
          ) : (
            <>
              <ArrowRight className="hidden h-4 w-4 md:block" />
              <ArrowDown className="h-4 w-4 md:hidden" />
            </>
          )}
        </span>
      </div>

      {/* File header + Custom Default Value (right) */}
      <div className="space-y-1.5">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <select
              id={selectId}
              aria-required={column.isRequired && !hasDefault}
              aria-label={`File header for ${column.columnName}`}
              className={clsx(SELECT_CLASSES, unresolved && "border-rose-300")}
              value={selected}
              onChange={(e) => onChange(column.columnName, e.target.value)}
            >
              <option value="">
                {hasDefault
                  ? "— Using custom default value —"
                  : column.isRequired
                    ? "Select a header (or set default)…"
                    : "— Not mapped —"}
              </option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {calculatedNames.includes(header) ? `fx ${header} (calculated)` : header}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              id={defaultId}
              type="text"
              aria-label={`Custom default value for ${column.columnName}`}
              className={INPUT_CLASSES}
              placeholder={
                selected
                  ? "Fallback default if blank (optional)"
                  : "Or custom default value for all rows…"
              }
              value={defaultValue}
              onChange={(e) => onDefaultChange(column.columnName, e.target.value)}
            />
          </div>
        </div>
        {sample !== null && (
          <p className="truncate px-1 text-xs text-zinc-500">
            Sample from file: <span className="font-medium text-zinc-700">{sample}</span>
            {hasDefault && ` · Blank cells fallback to "${defaultValue.trim()}"`}
          </p>
        )}
        {!selected && hasDefault && (
          <p className="truncate px-1 text-xs text-emerald-700">
            All rows will receive custom default value:{" "}
            <span className="font-mono font-semibold">&ldquo;{defaultValue.trim()}&rdquo;</span>
          </p>
        )}
      </div>
    </li>
  );
}
