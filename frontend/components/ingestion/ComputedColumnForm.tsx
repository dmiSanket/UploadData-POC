"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Field, INPUT_CLASSES, SELECT_CLASSES } from "@/components/shared/Field";
import type { ColumnDefinition, ComputedColumn, ParsedSpreadsheet } from "@/lib/types";
import { checkFormula, evaluateColumn, validateComputedColumn } from "@/lib/utils/computedColumns";

export type NewComputedColumn = Omit<ComputedColumn, "id">;

interface ComputedColumnFormProps {
  /** Spreadsheet including earlier calculated columns (valid formula inputs). */
  parsed: ParsedSpreadsheet;
  /** System columns the result can be mapped to straight away. */
  targets: ColumnDefinition[];
  onAdd: (column: NewComputedColumn, targetColumn: string | null) => void;
  onCancel: () => void;
}

const OPERATORS = ["+", "-", "*", "/", "(", ")"];
const PREVIEW_ROWS = 3;

export function ComputedColumnForm({ parsed, targets, onAdd, onCancel }: ComputedColumnFormProps) {
  const formulaRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState("");
  const [name, setName] = useState("");
  const [formula, setFormula] = useState("");
  const [blankAsZero, setBlankAsZero] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolvedName = name.trim() || target;
  const formulaError = formula.trim() ? checkFormula(formula, parsed.headers) : null;

  const preview = useMemo(() => {
    if (!formula.trim() || checkFormula(formula, parsed.headers)) return null;
    return evaluateColumn(parsed.rows.slice(0, PREVIEW_ROWS), { formula, blankAsZero });
  }, [formula, blankAsZero, parsed]);

  // Inserts text where the caret is so chips and operators build the formula.
  const insert = (text: string) => {
    const input = formulaRef.current;
    const start = input?.selectionStart ?? formula.length;
    const end = input?.selectionEnd ?? start;
    setFormula(`${formula.slice(0, start)}${text}${formula.slice(end)}`);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validateComputedColumn({ name: resolvedName, formula }, parsed.headers);
    if (problem) {
      setSubmitError(problem);
      return;
    }
    onAdd({ name: resolvedName, formula: formula.trim(), blankAsZero }, target || null);
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-brand-200 bg-brand-50/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Map result to system column" htmlFor="cc-target" hint="Optional — maps the result for you.">
          <select
            id="cc-target"
            className={SELECT_CLASSES}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">— Choose later —</option>
            {targets.map((column) => (
              <option key={column.id} value={column.columnName}>
                {column.columnName} ({column.dataType})
              </option>
            ))}
          </select>
        </Field>
        <Field label="New column name" htmlFor="cc-name" hint="Defaults to the system column name.">
          <input
            id="cc-name"
            className={INPUT_CLASSES}
            placeholder={target || "e.g. current_stock"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Formula" htmlFor="cc-formula">
        <input
          id="cc-formula"
          ref={formulaRef}
          className={`${INPUT_CLASSES} font-mono`}
          placeholder="[Opening Stock] + [Received] - [Issued]"
          value={formula}
          autoComplete="off"
          onChange={(e) => setFormula(e.target.value)}
        />
      </Field>

      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500">Click to insert a column or operator</p>
        <div className="flex flex-wrap gap-1.5">
          {parsed.headers.map((header) => (
            <button
              key={header}
              type="button"
              disabled={header.includes("]")}
              onClick={() => insert(`[${header}]`)}
              className="rounded-lg bg-white px-2 py-1 font-mono text-xs text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-brand-50 hover:ring-brand-300 disabled:opacity-40"
            >
              {header}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {OPERATORS.map((operator) => (
            <button
              key={operator}
              type="button"
              aria-label={`Insert ${operator}`}
              onClick={() => insert(` ${operator} `)}
              className="h-7 w-8 rounded-lg bg-zinc-900 font-mono text-sm text-white hover:bg-zinc-700"
            >
              {operator}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 accent-brand-600"
          checked={blankAsZero}
          onChange={(e) => setBlankAsZero(e.target.checked)}
        />
        Treat blank cells as 0
      </label>

      {formulaError && <Alert tone="error">{formulaError}</Alert>}
      {submitError && !formulaError && <Alert tone="error">{submitError}</Alert>}

      {preview && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <p className="border-b border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Preview · first {preview.length} rows
          </p>
          <ul className="divide-y divide-zinc-100 text-sm">
            {preview.map((value, index) => (
              <li key={parsed.rowNumbers[index]} className="flex items-center justify-between px-3 py-1.5">
                <span className="text-zinc-400">Row {parsed.rowNumbers[index]}</span>
                {value === null ? (
                  <span className="text-xs font-medium text-rose-600">blank (a blank or non-numeric input)</span>
                ) : (
                  <span className="font-mono font-medium text-zinc-900">{value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formula.trim() || Boolean(formulaError)}>
          <Plus className="h-4 w-4" aria-hidden /> Add column
        </Button>
      </div>
    </form>
  );
}

