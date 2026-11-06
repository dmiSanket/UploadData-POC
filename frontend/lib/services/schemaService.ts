import type {
  ColumnDefinition,
  ColumnInput,
  FileSchemaDetail,
  FileSchemaSummary,
  SavedMappingConfig,
} from "@/lib/types";
import { apiRequest } from "./apiClient";

export const schemaService = {
  list: () => apiRequest<FileSchemaSummary[]>("/api/file-schemas"),

  get: (id: number) => apiRequest<FileSchemaDetail>(`/api/file-schemas/${id}`),

  lookup: (categoryId: number, scopeId: number) =>
    apiRequest<FileSchemaDetail>(
      `/api/file-schemas/lookup?categoryId=${categoryId}&scopeId=${scopeId}`,
    ),

  create: (categoryId: number, scopeId: number) =>
    apiRequest<FileSchemaDetail>("/api/file-schemas", {
      method: "POST",
      body: { categoryId, scopeId },
    }),

  remove: (id: number) => apiRequest<void>(`/api/file-schemas/${id}`, { method: "DELETE" }),

  saveMapping: (schemaId: number, config: Omit<SavedMappingConfig, "updatedAt">) =>
    apiRequest<FileSchemaDetail>(`/api/file-schemas/${schemaId}/mapping`, {
      method: "PUT",
      body: config,
    }),

  clearMapping: (schemaId: number) =>
    apiRequest<FileSchemaDetail>(`/api/file-schemas/${schemaId}/mapping`, {
      method: "DELETE",
    }),

  addColumn: (schemaId: number, input: ColumnInput) =>
    apiRequest<ColumnDefinition>(`/api/file-schemas/${schemaId}/columns`, {
      method: "POST",
      body: input,
    }),

  updateColumn: (columnId: number, input: ColumnInput) =>
    apiRequest<ColumnDefinition>(`/api/columns/${columnId}`, { method: "PUT", body: input }),

  removeColumn: (columnId: number) =>
    apiRequest<void>(`/api/columns/${columnId}`, { method: "DELETE" }),
};

