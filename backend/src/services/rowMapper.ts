import type { CellValue, ColumnRule, RowError } from "../types";
import { validateCell } from "./cellValidator";

export type RawRow = Record<string, unknown>;
/** schema columnName -> header in the uploaded file */
export type MappingDictionary = Record<string, string>;

export interface MappedRow {
  rowNumber: number;
  data: Record<string, CellValue>;
}

export interface MapAndValidateResult {
  validRows: MappedRow[];
  errors: RowError[];
  /** Total number of errors found, which may exceed errors.length when capped. */
  totalErrors: number;
}

export const MAX_REPORTED_ERRORS = 500;

/** Returns required column names that have no mapping entry. */
export function findUnmappedRequired(
  columns: ColumnRule[],
  mapping: MappingDictionary,
): string[] {
  return columns
    .filter((c) => c.isRequired && !mapping[c.columnName]?.trim())
    .map((c) => c.columnName);
}

/**
 * Swaps the uploaded file's keys for the schema keys using the mapping, then
 * validates each cell. Columns without a mapping are stored as null (or
 * flagged when required). Unmapped file columns are dropped.
 */
export function mapAndValidateRows(
  rows: RawRow[],
  columns: ColumnRule[],
  mapping: MappingDictionary,
  rowNumbers?: number[],
): MapAndValidateResult {
  const validRows: MappedRow[] = [];
  const errors: RowError[] = [];
  let totalErrors = 0;

  rows.forEach((rawRow, index) => {
    // Default assumes the header occupies row 1 and no rows were skipped.
    const rowNumber = rowNumbers?.[index] ?? index + 2;
    const data: Record<string, CellValue> = {};
    let rowValid = true;

    for (const column of columns) {
      const sourceHeader = mapping[column.columnName] ?? "";
      const raw = sourceHeader ? rawRow[sourceHeader] : undefined;
      const result = validateCell(raw, column);

      if (result.ok) {
        data[column.columnName] = result.value;
        continue;
      }

      rowValid = false;
      totalErrors += 1;
      if (errors.length < MAX_REPORTED_ERRORS) {
        errors.push({
          row: rowNumber,
          column: column.columnName,
          sourceHeader,
          value: raw ?? null,
          message: result.message,
        });
      }
    }

    if (rowValid) validRows.push({ rowNumber, data });
  });

  return { validRows, errors, totalErrors };
}

