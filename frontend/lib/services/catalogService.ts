import type { NamedEntity, ScopeEntity, ScopeInput } from "@/lib/types";
import { apiRequest } from "./apiClient";

export type CatalogKind = "categories" | "dealers" | "locations" | "brands";

export const catalogService = {
  list: (kind: CatalogKind) => apiRequest<NamedEntity[]>(`/api/${kind}`),

  create: (kind: CatalogKind, name: string) =>
    apiRequest<NamedEntity>(`/api/${kind}`, { method: "POST", body: { name } }),

  update: (kind: CatalogKind, id: number, name: string) =>
    apiRequest<NamedEntity>(`/api/${kind}/${id}`, { method: "PUT", body: { name } }),

  remove: (kind: CatalogKind, id: number) =>
    apiRequest<void>(`/api/${kind}/${id}`, { method: "DELETE" }),
};

export const scopeService = {
  list: (categoryId?: number) =>
    apiRequest<ScopeEntity[]>(
      categoryId ? `/api/scopes?categoryId=${categoryId}` : "/api/scopes",
    ),

  create: (input: ScopeInput) =>
    apiRequest<ScopeEntity>("/api/scopes", { method: "POST", body: input }),

  update: (id: number, input: ScopeInput) =>
    apiRequest<ScopeEntity>(`/api/scopes/${id}`, { method: "PUT", body: input }),

  remove: (id: number) =>
    apiRequest<void>(`/api/scopes/${id}`, { method: "DELETE" }),
};
