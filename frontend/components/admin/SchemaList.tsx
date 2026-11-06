"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { ChevronRight, FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScopePills } from "@/components/shared/ScopePills";
import type { FileSchemaSummary } from "@/lib/types";

export interface SchemaSelection {
  categoryId: number;
  scopeId: number;
}

interface SchemaListProps {
  schemas: FileSchemaSummary[];
  loading: boolean;
  selected: SchemaSelection | null;
  onSelect: (selection: SchemaSelection) => void;
  onNew: () => void;
}

/** "Layers"-style list of schemas grouped by category, showing target pills. */
export function SchemaList({ schemas, loading, selected, onSelect, onNew }: SchemaListProps) {
  const groups = useMemo(() => {
    const byCategory = new Map<number, { name: string; items: FileSchemaSummary[] }>();
    for (const schema of schemas) {
      const group = byCategory.get(schema.categoryId) ?? { name: schema.category.name, items: [] };
      group.items.push(schema);
      byCategory.set(schema.categoryId, group);
    }
    return [...byCategory.values()];
  }, [schemas]);

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-frame">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <FolderTree className="h-4 w-4 text-zinc-400" aria-hidden /> Schemas
        </h2>
        <Button size="sm" variant="soft" onClick={onNew}>
          <Plus className="h-3.5 w-3.5" aria-hidden /> New
        </Button>
      </div>

      <div className="max-h-[34rem] overflow-y-auto p-2">
        {loading && <p className="p-3 text-sm text-zinc-500">Loading…</p>}
        {!loading && schemas.length === 0 && (
          <EmptyState
            icon={<FolderTree className="h-5 w-5" />}
            title="No schemas yet"
            description="Create your first category + target scope schema."
          />
        )}

        {groups.map((group) => (
          <div key={group.name} className="mb-3 last:mb-0">
            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {group.name}
            </p>
            <ul className="space-y-1">
              {group.items.map((schema) => {
                const active =
                  selected?.categoryId === schema.categoryId && selected.scopeId === schema.scopeId;
                return (
                  <li key={schema.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        onSelect({ categoryId: schema.categoryId, scopeId: schema.scopeId })
                      }
                      className={clsx(
                        "w-full rounded-xl p-2.5 text-left transition-colors",
                        active
                          ? "bg-accent/10 text-zinc-900 ring-1 ring-inset ring-accent/40"
                          : "text-zinc-700 hover:bg-zinc-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {schema.scope.name}
                        </span>
                        <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
                          {schema._count.columns} cols
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" aria-hidden />
                      </div>
                      <ScopePills scope={schema.scope} compact className="mt-1.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
