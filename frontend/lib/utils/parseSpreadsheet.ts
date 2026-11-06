import type { ParsedSpreadsheet, RawRow } from "@/lib/types";
import { parseCsv } from "./parseCsv";

export const ACCEPTED_EXTENSIONS = [".xlsx", ".csv"];

type Grid = unknown[][];

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

/** Flattens ExcelJS' rich cell value shapes (formulas, rich text, hyperlinks, dates) to plain values. */
function normalizeExcelValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return value;

  const cell = value as Record<string, unknown>;
  if ("result" in cell) return normalizeExcelValue(cell.result);
  if (Array.isArray(cell.richText)) {
    return (cell.richText as { text: string }[]).map((part) => part.text).join("");
  }
  if (typeof cell.text === "string") return cell.text;
  if ("error" in cell) return null;
  return String(value);
}

async function readXlsxGrid(file: File): Promise<Grid[]> {
  // Loaded lazily: ExcelJS is large and only needed once a file is chosen.
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  return workbook.worksheets.map((sheet) => {
    const grid: Grid = [];
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const values = (row.values as unknown[]).slice(1).map(normalizeExcelValue);
      // Keep spreadsheet row numbers aligned with array positions.
      grid[rowNumber - 1] = values;
    });
    return Array.from(grid, (r) => r ?? []);
  });
}

/** Header cleanup: trim, drop blanks, de-duplicate ("Qty", "Qty (2)"). */
function buildHeaders(headerRow: unknown[]): { header: string; index: number }[] {
  const seen = new Map<string, number>();
  const headers: { header: string; index: number }[] = [];

  headerRow.forEach((cell, index) => {
    if (isBlank(cell)) return;
    const base = String(cell).trim();
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    headers.push({ header: count === 1 ? base : `${base} (${count})`, index });
  });
  return headers;
}

function gridToSpreadsheet(fileName: string, grid: Grid): ParsedSpreadsheet {
  // The first non-empty row is treated as the header row.
  const headerRowIndex = grid.findIndex((row) => row.some((cell) => !isBlank(cell)));
  if (headerRowIndex === -1) throw new Error("The file is empty");

  const columns = buildHeaders(grid[headerRowIndex]);
  const rows: RawRow[] = [];
  const rowNumbers: number[] = [];

  for (let r = headerRowIndex + 1; r < grid.length; r += 1) {
    const cells = grid[r] ?? [];
    if (cells.every(isBlank)) continue; // skip fully blank rows
    const row: RawRow = {};
    for (const { header, index } of columns) {
      row[header] = isBlank(cells[index]) ? null : cells[index];
    }
    rows.push(row);
    rowNumbers.push(r + 1); // 1-based spreadsheet row
  }

  if (rows.length === 0) throw new Error("The file has headers but no data rows");
  return { fileName, headers: columns.map((c) => c.header), rows, rowNumbers };
}

/** Parses an .xlsx (first worksheet) or .csv file entirely in the browser. */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const extension = extensionOf(file.name);

  if (extension === ".csv") {
    return gridToSpreadsheet(file.name, parseCsv(await file.text()));
  }
  if (extension === ".xlsx") {
    const sheets = await readXlsxGrid(file);
    if (sheets.length === 0) throw new Error("The workbook has no worksheets");
    return gridToSpreadsheet(file.name, sheets[0]);
  }
  throw new Error("Unsupported file type. Please upload an .xlsx or .csv file");
}

