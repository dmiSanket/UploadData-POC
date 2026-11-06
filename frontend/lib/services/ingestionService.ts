import type {
  IngestedBatchRecord,
  IngestedDataRow,
  IngestResult,
  MappingDictionary,
  RawRow,
  SavedMappingConfig,
} from "@/lib/types";
import { apiRequest } from "./apiClient";

export interface IngestPayload {
  fileSchemaId: number;
  batchId?: number;
  mapping: MappingDictionary;
  rows: RawRow[];
  rowNumbers: number[];
  fileName: string;
  uploadedBy: string;
  savedMapping?: Omit<SavedMappingConfig, "updatedAt">;
}

const UPLOAD_CHUNK_SIZE = 1500;

export const ingestionService = {
  /** Resolves with either a success summary or the detailed validation failure (HTTP 422). */
  submit: async (payload: IngestPayload): Promise<IngestResult> => {
    // If small payload, submit in a single request
    if (payload.rows.length <= UPLOAD_CHUNK_SIZE) {
      return apiRequest<IngestResult>("/api/ingest", {
        method: "POST",
        body: payload,
        acceptStatuses: [422],
      });
    }

    // For large uploads, chunk to stay well under Vercel's 4.5 MB serverless limit
    let currentBatchId: number | null = null;
    let totalRowsInserted = 0;

    for (let start = 0; start < payload.rows.length; start += UPLOAD_CHUNK_SIZE) {
      const end = start + UPLOAD_CHUNK_SIZE;
      const chunkRows = payload.rows.slice(start, end);
      const chunkRowNumbers = payload.rowNumbers.slice(start, end);

      const chunkBody: IngestPayload = {
        fileSchemaId: payload.fileSchemaId,
        batchId: currentBatchId ?? undefined,
        mapping: payload.mapping,
        rows: chunkRows,
        rowNumbers: chunkRowNumbers,
        fileName: payload.fileName,
        uploadedBy: payload.uploadedBy,
        savedMapping: start === 0 ? payload.savedMapping : undefined,
      };

      const chunkResult: IngestResult = await apiRequest<IngestResult>("/api/ingest", {
        method: "POST",
        body: chunkBody,
        acceptStatuses: [422],
      });

      if (!chunkResult.success) {
        return chunkResult;
      }

      currentBatchId = chunkResult.batchId;
      totalRowsInserted += chunkResult.rowsInserted;
    }

    return {
      success: true,
      batchId: currentBatchId as number,
      rowsInserted: totalRowsInserted,
    };
  },

  listBatches: () => apiRequest<IngestedBatchRecord[]>("/api/batches"),

  getBatchRows: (batchId: number, limit = 100, offset = 0) =>
    apiRequest<{ total: number; rows: IngestedDataRow[] }>(
      `/api/batches/${batchId}/rows?limit=${limit}&offset=${offset}`,
    ),

  removeBatch: (batchId: number) =>
    apiRequest<void>(`/api/batches/${batchId}`, { method: "DELETE" }),
};
