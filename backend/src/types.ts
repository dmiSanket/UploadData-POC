export type DataType = "String" | "Number" | "Date" | "Boolean";

export interface ValidationRules {
  regex?: string;
  min?: number | string;
  max?: number | string;
  minLength?: number;
  maxLength?: number;
}

export interface ColumnRule {
  columnName: string;
  dataType: DataType;
  isRequired: boolean;
  validationRules: ValidationRules | null;
}

export interface RowError {
  /** Spreadsheet row number (header is row 1, first data row is row 2). */
  row: number;
  column: string;
  /** File header the value came from. */
  sourceHeader: string;
  value: unknown;
  message: string;
}

export type CellValue = string | number | boolean | null;

