"use client";

import { useEffect, useState } from "react";
import { MousePointerClick } from "lucide-react";
import type { UseCatalogResult } from "@/hooks/useCatalog";
import { useFileSchema } from "@/hooks/useFileSchema";
import { useSchemaList } from "@/hooks/useSchemaList";
import type { UseScopesResult } from "@/hooks/useScopes";
import { ApiError } from "@/lib/services/apiClient";
import { schemaService } from "@/lib/services/schemaService";
import type { ScopeInput } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { NewSchemaPicker } from "./NewSchemaPicker";
import { SchemaEditor } from "./SchemaEditor";
import { SchemaList, type SchemaSelection } from "./SchemaList";

interface SchemaWorkspaceProps {
  categories: UseCatalogResult;
  scopesState: UseScopesResult;
  dealers: UseCatalogResult;
  locations: UseCatalogResult;
  brands: UseCatalogResult;
}

/** Two panes: the list of schemas ("layers") and the editor ("inspector") for the selected one. */
export function SchemaWorkspace({
  categories,
  scopesState,
  dealers,
  locations,
  brands,
}: SchemaWorkspaceProps) {
  const list = useSchemaList();
  const [selected, setSelected] = useState<SchemaSelection | null>(null);
  const [creating, setCreating] = useState(false);

  // Auto-select the first schema once loaded so the inspector isn't blank on initial open.
  useEffect(() => {
    if (!selected && !creating && list.schemas.length > 0) {
      const first = list.schemas[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial default selection
      setSelected({ categoryId: first.categoryId, scopeId: first.scopeId });
    }
  }, [list.schemas, selected, creating]);

  const state = useFileSchema(
    selected?.categoryId ?? null,
    selected?.scopeId ?? null,
    list.reload,
  );

  const createWithScopeId = async (selection: SchemaSelection): Promise<string | null> => {
    try {
      await schemaService.lookup(selection.categoryId, selection.scopeId).catch(async (err) => {
        if (!(err instanceof ApiError && err.status === 404)) throw err;
        await schemaService.create(selection.categoryId, selection.scopeId);
      });
      await list.reload();
      setSelected(selection);
      setCreating(false);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not create schema";
    }
  };

  const createWithComposedScope = async (
    categoryId: number,
    scopeInput: ScopeInput,
  ): Promise<string | null> => {
    const scope = await scopesState.create(scopeInput);
    if (!scope) return scopesState.error ?? "Could not create scope";
    return createWithScopeId({ categoryId, scopeId: scope.id });
  };

  const deleteSchema = async (): Promise<boolean> => {
    const deleted = await state.deleteSchema();
    if (deleted) setSelected(null);
    return deleted;
  };

  const category = categories.items.find((c) => c.id === selected?.categoryId);
  const scope = scopesState.scopes.find((s) => s.id === selected?.scopeId);

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr] lg:items-start lg:gap-6">
      <div className="lg:sticky lg:top-6">
        <SchemaList
          schemas={list.schemas}
          loading={list.loading}
          selected={selected}
          onSelect={(next) => {
            setSelected(next);
            setCreating(false);
          }}
          onNew={() => setCreating(true)}
        />
      </div>

      <div className="min-w-0 space-y-5">
        {creating && (
          <NewSchemaPicker
            categories={categories.items}
            scopes={scopesState.scopes}
            dealers={dealers}
            locations={locations}
            brands={brands}
            onCreateWithScopeId={createWithScopeId}
            onCreateWithComposedScope={createWithComposedScope}
            onCancel={() => setCreating(false)}
          />
        )}

        {!creating && category && scope && (
          <SchemaEditor
            categoryName={category.name}
            scopeName={scope.name}
            state={{ ...state, deleteSchema }}
          />
        )}

        {!creating && !selected && (
          <EmptyState
            icon={<MousePointerClick className="h-5 w-5" />}
            title="Select a schema"
            description="Pick a schema on the left to edit its columns, or create a new one."
          />
        )}
      </div>
    </div>
  );
}
