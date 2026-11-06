export type DataType = "String" | "Number" | "Date" | "Boolean";

export const DATA_TYPES: DataType[] = ["String", "Number", "Date", "Boolean"];

export interface NamedEntity {
  id: number;
  name: string;
  createdAt: string;
}

export interface ScopeEntity {
  id: number;
  name: string;
  createdAt: string;
  dealers: NamedEntity[];
  locations: NamedEntity[];
  brands: NamedEntity[];
  _count?: { fileSchemas: number };
}

export interface ScopeInput {
  name?: string;
  dealerIds: number[];
  locationIds: number[];
  brandIds: number[];
}

export interface ValidationRules {
  regex?: string;
  min?: number | string;
  max?: number | string;
  minLength?: number;
  maxLength?: number;
}

export interface ColumnDefinition {
  id: number;
  fileSchemaId: number;
  columnName: string;
  dataType: DataType;
  isRequired: boolean;
  validationRules: ValidationRules | null;
  position: number;
}

export interface ColumnInput {
  columnName: string;
  dataType: DataType;
  isRequired: boolean;
  validationRules: ValidationRules | null;
}

export interface FileSchemaSummary {
  id: number;
  categoryId: number;
  scopeId: number;
  savedMapping?: SavedMappingConfig | null;
  category: NamedEntity;
  scope: ScopeEntity;
  _count: { columns: number };
}

export interface FileSchemaDetail {
  id: number;
  categoryId: number;
  scopeId: number;
  savedMapping?: SavedMappingConfig | null;
  category: NamedEntity;
  scope: ScopeEntity;
  columns: ColumnDefinition[];
}

export interface RowError {
  row: number;
  column: string;
  sourceHeader: string;
  value: unknown;
  message: string;
}

export interface IngestSuccess {
  success: true;
  batchId: number;
  rowsInserted: number;
}

export interface IngestFailure {
  success: false;
  totalRows: number;
  invalidRows: number;
  totalErrors: number;
  errors: RowError[];
}

export type IngestResult = IngestSuccess | IngestFailure;

export interface IngestedBatchRecord {
  id: number;
  fileSchemaId: number;
  uploadDate: string;
  uploadedBy: string;
  fileName: string | null;
  rowCount: number;
  fileSchema: FileSchemaDetail;
}

export interface IngestedDataRow {
  id: number;
  batchId: number;
  rowNumber: number;
  rowData: Record<string, string | number | boolean | null>;
}

/** schema columnName -> header in the uploaded file ("" when unmapped) */
export type MappingDictionary = Record<string, string>;

/** schema columnName -> custom default/constant value string ("" when none) */
export type DefaultValuesDictionary = Record<string, string>;

export type RawRow = Record<string, unknown>;

/** A column created in the browser from an arithmetic formula over other columns. */
export interface ComputedColumn {
  id: string;
  /** Header name of the new column (what the mapping dropdown shows). */
  name: string;
  /** e.g. "[Opening] + [Received] - [Issued]" */
  formula: string;
  /** When true, blank cells count as 0 instead of making the result blank. */
  blankAsZero: boolean;
}

/** A row filter over a single column or a combination of columns (raw or calculated). */
export interface RowFilter {
  id: string;
  /** One column (e.g. ["Dealer"]) or multiple combined columns (e.g. ["Dealer", "Location"]). */
  columns: string[];
  /** Multi-selected distinct values to keep. When empty, all rows pass this filter. */
  selectedValues: string[];
}

/** Scope-level mapping & calculated-columns template persisted in PostgreSQL on FileSchema. */
export interface SavedMappingConfig {
  mapping: MappingDictionary;
  defaultValues: DefaultValuesDictionary;
  computedColumns: ComputedColumn[];
  updatedAt?: string;
}

/** Whether to use the mapping only for this upload ("now") or persist it to DB ("save"). */
export type MappingPersistenceMode = "now" | "save";

export interface ParsedSpreadsheet {
  fileName: string;
  headers: string[];
  rows: RawRow[];
  /** 1-based spreadsheet row number for each entry in `rows`. */
  rowNumbers: number[];
}
