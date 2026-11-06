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
  mapping: MappingDictionary;
  rows: RawRow[];
  rowNumbers: number[];
  fileName: string;
  uploadedBy: string;
  savedMapping?: Omit<SavedMappingConfig, "updatedAt">;
}

export const ingestionService = {
  /** Resolves with either a success summary or the detailed validation failure (HTTP 422). */
  submit: (payload: IngestPayload) =>
    apiRequest<IngestResult>("/api/ingest", {
      method: "POST",
      body: payload,
      acceptStatuses: [422],
    }),

  listBatches: () => apiRequest<IngestedBatchRecord[]>("/api/batches"),

  getBatchRows: (batchId: number, limit = 100, offset = 0) =>
    apiRequest<{ total: number; rows: IngestedDataRow[] }>(
      `/api/batches/${batchId}/rows?limit=${limit}&offset=${offset}`,
    ),

  removeBatch: (batchId: number) =>
    apiRequest<void>(`/api/batches/${batchId}`, { method: "DELETE" }),
};
