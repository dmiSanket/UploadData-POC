import type {
  ColumnDefinition,
  DefaultValuesDictionary,
  MappingDictionary,
} from "@/lib/types";

/** Lowercases and strips everything except letters and digits: "Part Num." -> "partnum". */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Pre-fills the mapping where an uploaded header matches a schema column name
 * (ignoring case, spaces and punctuation). Each file header is used at most once.
 */
export function suggestMapping(
  columns: ColumnDefinition[],
  headers: string[],
): MappingDictionary {
  const byNormalized = new Map<string, string>();
  for (const header of headers) {
    const key = normalize(header);
    if (!byNormalized.has(key)) byNormalized.set(key, header);
  }

  const used = new Set<string>();
  const mapping: MappingDictionary = {};

  for (const column of columns) {
    const match = byNormalized.get(normalize(column.columnName));
    if (match && !used.has(match)) {
      mapping[column.columnName] = match;
      used.add(match);
    } else {
      mapping[column.columnName] = "";
    }
  }
  return mapping;
}

/** Required column names that currently have neither a mapped file header nor a custom default value. */
export function missingRequired(
  columns: ColumnDefinition[],
  mapping: MappingDictionary,
  defaultValues: DefaultValuesDictionary = {},
): string[] {
  return columns
    .filter((c) => {
      if (!c.isRequired) return false;
      const hasHeader = Boolean(mapping[c.columnName]?.trim());
      const hasDefault = Boolean(defaultValues[c.columnName]?.trim());
      return !hasHeader && !hasDefault;
    })
    .map((c) => c.columnName);
}

