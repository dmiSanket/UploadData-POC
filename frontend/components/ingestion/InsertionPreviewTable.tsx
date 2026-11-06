"use client";

import { useState } from "react";
import clsx from "clsx";
import { Calculator, Eye, Sparkles } from "lucide-react";
import { Badge, DataTypeBadge } from "@/components/shared/Badge";
import type { ColumnDefinition } from "@/lib/types";
import type { PreviewInsertedRow } from "@/lib/utils/prepareIngestionPayload";

const INITIAL_LIMIT = 10;

interface InsertionPreviewTableProps {
  columns: ColumnDefinition[];
  previewRows: PreviewInsertedRow[];
  totalUploadedRows?: number;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

/**
 * Displays the exact remapped rows (`IngestedData.rowData`) that will be validated
 * and inserted into PostgreSQL when the user clicks Submit.
 */
export function InsertionPreviewTable({
  columns,
  previewRows,
  totalUploadedRows,
}: InsertionPreviewTableProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? previewRows : previewRows.slice(0, INITIAL_LIMIT);
  const isFiltered =
    totalUploadedRows !== undefined && totalUploadedRows !== previewRows.length;

  return (
    <div data-testid="insertion-preview-table" className="mt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-brand-600" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Data to be inserted ({previewRows.length} {previewRows.length === 1 ? "row" : "rows"}
            {isFiltered ? `, filtered from ${totalUploadedRows}` : ""})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="brand">
            <Calculator className="mr-1 h-3 w-3" aria-hidden /> Calculated value
          </Badge>
          <Badge tone="emerald">
            <Sparkles className="mr-1 h-3 w-3" aria-hidden /> Custom default value
          </Badge>
          {previewRows.length > INITIAL_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {showAll
                ? `Show first ${INITIAL_LIMIT} rows`
                : `Show all ${previewRows.length} rows`}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-2xs">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2.5 text-zinc-400">Row #</th>
              {columns.map((col) => (
                <th key={col.id} className="whitespace-nowrap px-3 py-2.5">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-900">
                    <span>{col.columnName}</span>
                    <DataTypeBadge dataType={col.dataType} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visibleRows.map((row) => (
              <tr key={row.rowNumber} className="hover:bg-zinc-50/70">
                <td className="px-3 py-2 tabular-nums text-zinc-400">{row.rowNumber}</td>
                {columns.map((col) => {
                  const cell = row.cells[col.columnName] ?? { value: null, source: "null" };
                  const display = formatCellValue(cell.value);
                  return (
                    <td
                      key={col.id}
                      className={clsx(
                        "max-w-56 truncate px-3 py-2",
                        cell.source === "calculated" &&
                          "bg-brand-50/50 font-mono font-semibold text-brand-700",
                        cell.source === "default" &&
                          "bg-emerald-50/60 font-mono font-medium text-emerald-800",
                        cell.source === "file" && "text-zinc-800",
                      )}
                    >
                      {display ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span>{display}</span>
                          {cell.source === "default" && (
                            <span className="rounded bg-emerald-100 px-1 py-0.2 text-[10px] font-sans font-medium text-emerald-700">
                              default
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-zinc-300">null</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

