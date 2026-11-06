import type { ComputedColumn, ParsedSpreadsheet, RawRow } from "@/lib/types";
import { compileFormula, evaluateFormula } from "./formula";

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

/** Converts a parsed cell to a number; null when blank (unless blankAsZero) or not numeric. */
export function toNumber(value: unknown, blankAsZero: boolean): number | null {
  if (isBlank(value)) return blankAsZero ? 0 : null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/,/g, "");
    return Number.isFinite(Number(cleaned)) ? Number(cleaned) : null;
  }
  return null;
}

/** Returns a message when the formula is invalid or uses unknown columns, otherwise null. */
export function checkFormula(formula: string, availableHeaders: string[]): string | null {
  const compiled = compileFormula(formula);
  if (!compiled.ok) return compiled.error;

  const known = new Set(availableHeaders);
  const unknown = compiled.references.filter((name) => !known.has(name));
  return unknown.length > 0 ? `Unknown column: ${unknown.map((n) => `[${n}]`).join(", ")}` : null;
}

/** Full validation for a new computed column against the headers that exist before it. */
export function validateComputedColumn(
  column: Pick<ComputedColumn, "name" | "formula">,
  existingHeaders: string[],
): string | null {
  const name = column.name.trim();
  if (!name) return "Give the new column a name";
  if (existingHeaders.some((header) => header.toLowerCase() === name.toLowerCase())) {
    return `A column named "${name}" already exists`;
  }
  return checkFormula(column.formula, existingHeaders);
}

/** Evaluates one computed column for the given rows (null = blank result). */
export function evaluateColumn(
  rows: RawRow[],
  column: Pick<ComputedColumn, "formula" | "blankAsZero">,
): (number | null)[] {
  const compiled = compileFormula(column.formula);
  if (!compiled.ok) return rows.map(() => null);

  return rows.map((row) =>
    evaluateFormula(compiled.ast, (name) => toNumber(row[name], column.blankAsZero)),
  );
}

/**
 * Returns a copy of the spreadsheet with each computed column appended. Columns
 * are applied in order, so a later formula can reference an earlier result.
 */
export function applyComputedColumns(
  parsed: ParsedSpreadsheet,
  columns: ComputedColumn[],
): ParsedSpreadsheet {
  if (columns.length === 0) return parsed;

  let headers = parsed.headers;
  let rows = parsed.rows;

  for (const column of columns) {
    if (validateComputedColumn(column, headers) !== null) continue; // stale definition
    const name = column.name.trim();
    const values = evaluateColumn(rows, column);
    rows = rows.map((row, index) => ({ ...row, [name]: values[index] }));
    headers = [...headers, name];
  }
  return { ...parsed, headers, rows };
}

/**
 * Removes a computed column plus any later column whose formula depends on it.
 * `removedNames` lets callers clear mappings that pointed at the removed columns.
 */
export function removeComputedColumn(
  columns: ComputedColumn[],
  id: string,
): { remaining: ComputedColumn[]; removedNames: string[] } {
  const removedNames: string[] = [];
  const remaining: ComputedColumn[] = [];

  for (const column of columns) {
    const compiled = compileFormula(column.formula);
    const dependsOnRemoved =
      compiled.ok && compiled.references.some((name) => removedNames.includes(name));

    if (column.id === id || dependsOnRemoved) {
      removedNames.push(column.name.trim());
    } else {
      remaining.push(column);
    }
  }
  return { remaining, removedNames };
}

