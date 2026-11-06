import { Alert } from "@/components/shared/Alert";
import type { IngestFailure, RowError } from "@/lib/types";

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  return String(value);
}

function errorKey(error: RowError, index: number): string {
  return `${error.row}-${error.column}-${index}`;
}

export function ValidationErrorTable({ failure }: { failure: IngestFailure }) {
  const { errors, totalErrors, invalidRows, totalRows } = failure;

  return (
    <div className="space-y-3">
      <Alert tone="error" title="Validation failed — nothing was saved">
        {invalidRows} of {totalRows} rows have problems ({totalErrors} issues in total).
        {errors.length < totalErrors && ` Showing the first ${errors.length}.`} Fix the file and upload
        it again.
      </Alert>

      {/* Desktop: table */}
      <div className="hidden max-h-96 overflow-auto rounded-xl border border-zinc-200 md:block">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">System column</th>
              <th className="px-3 py-2">File header</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Problem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {errors.map((error, index) => (
              <tr key={errorKey(error, index)}>
                <td className="px-3 py-2 tabular-nums">
                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700">{error.row}</span>
                </td>
                <td className="px-3 py-2 font-mono">{error.column}</td>
                <td className="px-3 py-2">{error.sourceHeader || "—"}</td>
                <td className="max-w-48 truncate px-3 py-2">{displayValue(error.value)}</td>
                <td className="px-3 py-2 text-rose-700">{error.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <ul className="max-h-96 space-y-2 overflow-auto md:hidden">
        {errors.map((error, index) => (
          <li key={errorKey(error, index)} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-medium text-zinc-900">{error.column}</span>
              <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-700">
                Row {error.row}
              </span>
            </div>
            <p className="mt-1 text-rose-700">{error.message}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {error.sourceHeader || "—"}: {displayValue(error.value)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
