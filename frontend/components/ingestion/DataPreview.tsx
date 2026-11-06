import clsx from "clsx";
import { Calculator } from "lucide-react";
import type { ParsedSpreadsheet } from "@/lib/types";

const PREVIEW_ROWS = 5;

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

interface DataPreviewProps {
  parsed: ParsedSpreadsheet;
  /** Names of calculated columns, highlighted so results stand out from file data. */
  calculated?: string[];
  /** Total row count before row filters were applied. */
  totalUnfilteredRows?: number;
}

/** Horizontally scrollable preview of the first rows of the uploaded file. */
export function DataPreview({ parsed, calculated = [], totalUnfilteredRows }: DataPreviewProps) {
  const rows = parsed.rows.slice(0, PREVIEW_ROWS);
  const isCalculated = (header: string) => calculated.includes(header);
  const isFiltered =
    totalUnfilteredRows !== undefined && totalUnfilteredRows !== parsed.rows.length;

  return (
    <div className="mt-5">
      <p className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
        <span>Preview</span>
        <span className={clsx(isFiltered && "font-semibold text-emerald-700")}>
          {isFiltered
            ? `Showing ${rows.length} of ${parsed.rows.length} filtered rows (from ${totalUnfilteredRows} total)`
            : `First ${rows.length} of ${parsed.rows.length} rows`}
        </span>
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2 text-zinc-400">#</th>
              {parsed.headers.map((header) => (
                <th
                  key={header}
                  className={clsx("whitespace-nowrap px-3 py-2", isCalculated(header) && "bg-brand-50 text-brand-700")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {isCalculated(header) && <Calculator className="h-3 w-3" aria-label="Calculated column" />}
                    {header}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row, index) => (
              <tr key={parsed.rowNumbers[index]}>
                <td className="px-3 py-2 tabular-nums text-zinc-400">{parsed.rowNumbers[index]}</td>
                {parsed.headers.map((header) => (
                  <td
                    key={header}
                    className={clsx(
                      "max-w-56 truncate px-3 py-2",
                      isCalculated(header) ? "bg-brand-50/50 font-mono font-semibold text-brand-700" : "text-zinc-700",
                    )}
                  >
                    {display(row[header]) || <span className="text-zinc-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={parsed.headers.length + 1}
                  className="px-3 py-6 text-center text-xs text-zinc-400"
                >
                  No rows match the active filter selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
