import type {
  ColumnDefinition,
  ComputedColumn,
  DefaultValuesDictionary,
  MappingDictionary,
  ParsedSpreadsheet,
  SavedMappingConfig,
} from "@/lib/types";
import { suggestMapping } from "./autoMap";
import { validateComputedColumn } from "./computedColumns";

export interface ResolvedSavedMapping {
  appliedFromDb: boolean;
  computedColumns: ComputedColumn[];
  mapping: MappingDictionary;
  defaultValues: DefaultValuesDictionary;
  restoredMappedCount: number;
  restoredComputedCount: number;
  restoredDefaultCount: number;
}

/**
 * Restores a scope's saved mapping, calculated columns, and default values against
 * a newly uploaded spreadsheet, validating that referenced headers exist in the file.
 */
export function resolveSavedMapping(
  parsed: ParsedSpreadsheet,
  columns: ColumnDefinition[],
  savedMapping?: SavedMappingConfig | null,
): ResolvedSavedMapping {
  if (!savedMapping) {
    return {
      appliedFromDb: false,
      computedColumns: [],
      mapping: suggestMapping(columns, parsed.headers),
      defaultValues: {},
      restoredMappedCount: 0,
      restoredComputedCount: 0,
      restoredDefaultCount: 0,
    };
  }

  // 1) Restore calculated columns whose source columns exist in the uploaded file
  const currentHeaders = [...parsed.headers];
  const computedColumns: ComputedColumn[] = [];

  for (const col of savedMapping.computedColumns ?? []) {
    if (validateComputedColumn(col, currentHeaders) === null) {
      computedColumns.push(col);
      currentHeaders.push(col.name.trim());
    }
  }

  // 2) Restore column mappings that match available file + calculated headers
  const availableHeaderSet = new Set(currentHeaders);
  const baseMapping = suggestMapping(columns, currentHeaders);
  const mapping: MappingDictionary = { ...baseMapping };
  let restoredMappedCount = 0;

  for (const col of columns) {
    const savedHeader = savedMapping.mapping?.[col.columnName]?.trim() ?? "";
    if (savedHeader && availableHeaderSet.has(savedHeader)) {
      mapping[col.columnName] = savedHeader;
      restoredMappedCount += 1;
    }
  }

  // 3) Restore custom default values for valid schema columns
  const defaultValues: DefaultValuesDictionary = {};
  let restoredDefaultCount = 0;

  for (const col of columns) {
    const savedDefault = savedMapping.defaultValues?.[col.columnName]?.trim() ?? "";
    if (savedDefault) {
      defaultValues[col.columnName] = savedDefault;
      restoredDefaultCount += 1;
    }
  }

  const restoredComputedCount = computedColumns.length;
  const appliedFromDb =
    restoredMappedCount > 0 || restoredComputedCount > 0 || restoredDefaultCount > 0;

  return {
    appliedFromDb,
    computedColumns,
    mapping,
    defaultValues,
    restoredMappedCount,
    restoredComputedCount,
    restoredDefaultCount,
  };
}

