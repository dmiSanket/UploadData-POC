import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/HttpError";
import type { ColumnRule, DataType, RowError, ValidationRules } from "../types";
import {
  findUnmappedRequired,
  mapAndValidateRows,
  type MappingDictionary,
  type RawRow,
} from "./rowMapper";

const INSERT_CHUNK_SIZE = 1000;

export interface SavedMappingInput {
  mapping: Record<string, string>;
  defaultValues: Record<string, string>;
  computedColumns: {
    id: string;
    name: string;
    formula: string;
    blankAsZero: boolean;
  }[];
}

export interface IngestInput {
  fileSchemaId: number;
  mapping: MappingDictionary;
  rows: RawRow[];
  rowNumbers?: number[];
  uploadedBy: string;
  fileName?: string;
  savedMapping?: SavedMappingInput;
}

export type IngestResult =
  | { success: true; batchId: number; rowsInserted: number }
  | { success: false; totalRows: number; invalidRows: number; totalErrors: number; errors: RowError[] };

/**
 * Maps, validates and stores rows. The operation is all-or-nothing: if any
 * row fails validation nothing is written and every problem is reported.
 */
export async function ingestRows(input: IngestInput): Promise<IngestResult> {
  const schema = await prisma.fileSchema.findUnique({
    where: { id: input.fileSchemaId },
    include: { columns: { orderBy: [{ position: "asc" }, { id: "asc" }] } },
  });
  if (!schema) throw new HttpError(404, "File schema not found");

  const columns: ColumnRule[] = schema.columns.map((c) => ({
    columnName: c.columnName,
    dataType: c.dataType as DataType,
    isRequired: c.isRequired,
    validationRules: (c.validationRules as ValidationRules | null) ?? null,
  }));
  if (columns.length === 0) {
    throw new HttpError(422, "This file schema has no columns defined yet");
  }

  assertMappingIsUsable(columns, input.mapping, input.rows);

  const { validRows, errors, totalErrors } = mapAndValidateRows(
    input.rows,
    columns,
    input.mapping,
    input.rowNumbers,
  );
  if (totalErrors > 0) {
    return {
      success: false,
      totalRows: input.rows.length,
      invalidRows: input.rows.length - validRows.length,
      totalErrors,
      errors,
    };
  }

  const batchId = await prisma.$transaction(
    async (tx) => {
      if (input.savedMapping) {
        const validColumnNames = new Set(columns.map((c) => c.columnName));
        const cleanMapping = Object.fromEntries(
          Object.entries(input.savedMapping.mapping).filter(
            ([colName, header]) => validColumnNames.has(colName) && header.trim() !== "",
          ),
        );
        const cleanDefaults = Object.fromEntries(
          Object.entries(input.savedMapping.defaultValues).filter(
            ([colName, val]) => validColumnNames.has(colName) && val.trim() !== "",
          ),
        );
        await tx.fileSchema.update({
          where: { id: schema.id },
          data: {
            savedMapping: {
              mapping: cleanMapping,
              defaultValues: cleanDefaults,
              computedColumns: input.savedMapping.computedColumns,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      const batch = await tx.ingestedBatch.create({
        data: {
          fileSchemaId: schema.id,
          uploadedBy: input.uploadedBy,
          fileName: input.fileName,
          rowCount: validRows.length,
        },
      });
      for (let start = 0; start < validRows.length; start += INSERT_CHUNK_SIZE) {
        await tx.ingestedData.createMany({
          data: validRows.slice(start, start + INSERT_CHUNK_SIZE).map((row) => ({
            batchId: batch.id,
            rowNumber: row.rowNumber,
            rowData: row.data as Prisma.InputJsonObject,
          })),
        });
      }
      return batch.id;
    },
    { timeout: 60_000 },
  );

  return { success: true, batchId, rowsInserted: validRows.length };
}

/** Rejects structurally invalid mappings before any row-level work happens. */
function assertMappingIsUsable(columns: ColumnRule[], mapping: MappingDictionary, rows: RawRow[]): void {
  const known = new Set(columns.map((c) => c.columnName));
  const unknown = Object.keys(mapping).filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new HttpError(400, `Mapping references unknown schema columns: ${unknown.join(", ")}`);
  }

  const missing = findUnmappedRequired(columns, mapping);
  if (missing.length > 0) {
    throw new HttpError(400, `Required columns are not mapped: ${missing.join(", ")}`);
  }

  const fileHeaders = new Set(rows.flatMap((row) => Object.keys(row)));
  const absent = Object.entries(mapping)
    .filter(([, header]) => header && !fileHeaders.has(header))
    .map(([, header]) => header);
  if (absent.length > 0) {
    throw new HttpError(400, `Mapped headers not found in uploaded data: ${absent.join(", ")}`);
  }
}

