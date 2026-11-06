import type {
  ColumnDefinition,
  DefaultValuesDictionary,
  MappingDictionary,
  ParsedSpreadsheet,
  RawRow,
} from "@/lib/types";

export type CellSourceType = "file" | "calculated" | "default" | "null";

export interface PreviewCell {
  value: unknown;
  source: CellSourceType;
}

export interface PreviewInsertedRow {
  rowNumber: number;
  cells: Record<string, PreviewCell>;
}

export interface PreparedIngestionPayload {
  /** Mapping dictionary to send to POST /api/ingest (only non-empty entries). */
  mapping: MappingDictionary;
  /** Rows with any custom default values materialized so the backend validates and stores them. */
  rows: RawRow[];
  rowNumbers: number[];
  /** Transformed rows keyed by target system columnName for the pre-upload preview table. */
  previewRows: PreviewInsertedRow[];
}

function isBlankCell(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

/**
 * Combines mapped file/calculated columns and custom default values into:
 * 1) The exact `rows` and `mapping` payload expected by `POST /api/ingest`
 * 2) A rich `previewRows` array showing the exact data and source of every cell to be inserted.
 */
export function prepareIngestionPayload(
  columns: ColumnDefinition[],
  parsed: ParsedSpreadsheet,
  mapping: MappingDictionary,
  defaultValues: DefaultValuesDictionary = {},
  calculatedNames: string[] = [],
): PreparedIngestionPayload {
  const calcSet = new Set(calculatedNames);
  const effectiveMapping: MappingDictionary = {};

  // Pre-compute how each system column resolves its value
  const resolvers = columns.map((col) => {
    const columnName = col.columnName;
    const sourceHeader = mapping[columnName]?.trim() ?? "";
    const defaultValue = defaultValues[columnName]?.trim() ?? "";
    const hasDefault = defaultValue !== "";

    if (!sourceHeader && !hasDefault) {
      return { columnName, sourceHeader: "", defaultValue: "", syntheticHeader: "" };
    }

    if (!hasDefault) {
      effectiveMapping[columnName] = sourceHeader;
      return { columnName, sourceHeader, defaultValue: "", syntheticHeader: "" };
    }

    const syntheticHeader = sourceHeader
      ? `${sourceHeader} (default: ${defaultValue})`
      : `[Default] ${columnName}`;
    effectiveMapping[columnName] = syntheticHeader;
    return { columnName, sourceHeader, defaultValue, syntheticHeader };
  });

  const rows: RawRow[] = [];
  const previewRows: PreviewInsertedRow[] = [];

  for (let i = 0; i < parsed.rows.length; i++) {
    const rawRow = parsed.rows[i];
    const rowNumber = parsed.rowNumbers[i] ?? i + 2;
    // Only keep mapped & default columns to avoid sending huge unmapped spreadsheet columns to Vercel
    const nextRow: RawRow = {};
    const cells: Record<string, PreviewCell> = {};

    for (const { columnName, sourceHeader, defaultValue, syntheticHeader } of resolvers) {
      if (!sourceHeader && !defaultValue) {
        cells[columnName] = { value: null, source: "null" };
        continue;
      }

      const rawVal = sourceHeader ? rawRow[sourceHeader] : undefined;
      const blank = isBlankCell(rawVal);
      const targetHeader = syntheticHeader || sourceHeader;

      if (!blank) {
        nextRow[targetHeader] = rawVal;
        cells[columnName] = {
          value: rawVal,
          source: calcSet.has(sourceHeader) ? "calculated" : "file",
        };
      } else if (defaultValue !== "") {
        nextRow[targetHeader] = defaultValue;
        cells[columnName] = {
          value: defaultValue,
          source: "default",
        };
      } else {
        cells[columnName] = { value: null, source: "null" };
      }
    }

    rows.push(nextRow);
    previewRows.push({ rowNumber, cells });
  }

  return {
    mapping: effectiveMapping,
    rows,
    rowNumbers: parsed.rowNumbers,
    previewRows,
  };
}

