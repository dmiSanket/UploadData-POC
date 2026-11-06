"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, FolderTree } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Field, SELECT_CLASSES } from "@/components/shared/Field";
import { ScopePills } from "@/components/shared/ScopePills";
import { catalogService, scopeService } from "@/lib/services/catalogService";
import type { NamedEntity, ScopeEntity } from "@/lib/types";
import { StepActions } from "./StepActions";

export interface SelectedContext {
  categoryId: number;
  scopeId: number;
}

interface ContextStepProps {
  initial: SelectedContext | null;
  onNext: (context: SelectedContext) => void;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function uniqueEntities(items: NamedEntity[]): NamedEntity[] {
  const byId = new Map<number, NamedEntity>();
  for (const item of items) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function ContextStep({ initial, onNext }: ContextStepProps) {
  const [categories, setCategories] = useState<NamedEntity[]>([]);
  const [scopes, setScopes] = useState<ScopeEntity[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [scopeId, setScopeId] = useState<number | null>(initial?.scopeId ?? null);
  const [dealerFilter, setDealerFilter] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [brandFilter, setBrandFilter] = useState<number | null>(null);
  const [scopesLoading, setScopesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogService
      .list("categories")
      .then(setCategories)
      .catch((err) => setError(messageOf(err)));
  }, []);

  // Cascade: the scope options depend on the selected category.
  useEffect(() => {
    if (categoryId === null) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for the fetch below
    setScopesLoading(true);
    scopeService
      .list(categoryId)
      .then((result) => {
        if (cancelled) return;
        setScopes(result);
        setScopeId((current) => {
          if (result.some((s) => s.id === current)) return current;
          return result.length === 1 ? result[0].id : null;
        });
      })
      .catch((err) => !cancelled && setError(messageOf(err)))
      .finally(() => !cancelled && setScopesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const onCategoryChange = (value: string) => {
    setScopes([]);
    setScopeId(null);
    setDealerFilter(null);
    setLocationFilter(null);
    setBrandFilter(null);
    setCategoryId(value === "" ? null : Number(value));
  };

  const availableDealers = useMemo(
    () => uniqueEntities(scopes.flatMap((s) => s.dealers)),
    [scopes],
  );
  const availableLocations = useMemo(
    () => uniqueEntities(scopes.flatMap((s) => s.locations)),
    [scopes],
  );
  const availableBrands = useMemo(
    () => uniqueEntities(scopes.flatMap((s) => s.brands)),
    [scopes],
  );

  const filteredScopes = useMemo(
    () =>
      scopes.filter((scope) => {
        if (dealerFilter && !scope.dealers.some((d) => d.id === dealerFilter)) return false;
        if (locationFilter && !scope.locations.some((l) => l.id === locationFilter)) return false;
        if (brandFilter && !scope.brands.some((b) => b.id === brandFilter)) return false;
        return true;
      }),
    [scopes, dealerFilter, locationFilter, brandFilter],
  );

  const noScopes = categoryId !== null && !scopesLoading && scopes.length === 0;

  return (
    <Card
      label="Step 1"
      icon={<FolderTree className="h-4 w-4" />}
      title="Select Document & Target Scope"
      description="Choose the document category, then pick the target Scope (specific Dealer, Location, and/or Brand combination)."
    >
      <div className="space-y-5">
        <Field label="1. Document Category" htmlFor="ctx-category">
          <select
            id="ctx-category"
            className={SELECT_CLASSES}
            value={categoryId ?? ""}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {categoryId !== null && scopes.length > 0 && (
          <div className="space-y-3">
            <div className="grid gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 sm:grid-cols-3">
              <Field label="Filter by Dealer" htmlFor="filter-dealer">
                <select
                  id="filter-dealer"
                  className={SELECT_CLASSES}
                  value={dealerFilter ?? ""}
                  onChange={(e) =>
                    setDealerFilter(e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">All dealers ({availableDealers.length})</option>
                  {availableDealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Filter by Location" htmlFor="filter-location">
                <select
                  id="filter-location"
                  className={SELECT_CLASSES}
                  value={locationFilter ?? ""}
                  onChange={(e) =>
                    setLocationFilter(e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">All locations ({availableLocations.length})</option>
                  {availableLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Filter by Brand" htmlFor="filter-brand">
                <select
                  id="filter-brand"
                  className={SELECT_CLASSES}
                  value={brandFilter ?? ""}
                  onChange={(e) =>
                    setBrandFilter(e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">All brands ({availableBrands.length})</option>
                  {availableBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-medium text-zinc-700">
                2. Select Target Scope ({filteredScopes.length})
              </p>
              <div className="grid gap-2.5">
                {filteredScopes.map((scope) => {
                  const active = scopeId === scope.id;
                  return (
                    <button
                      key={scope.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setScopeId(scope.id)}
                      className={clsx(
                        "flex w-full items-start justify-between gap-3 rounded-xl border p-3.5 text-left transition-all",
                        active
                          ? "border-accent bg-accent/5 ring-2 ring-accent/25"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/60",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900">{scope.name}</p>
                        <ScopePills scope={scope} className="mt-2" />
                      </div>
                      <span
                        className={clsx(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          active
                            ? "border-accent bg-accent text-white"
                            : "border-zinc-300 bg-white",
                        )}
                      >
                        {active && <Check className="h-3 w-3" aria-hidden />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {scopesLoading && (
        <p className="mt-4 text-sm text-zinc-500">Loading target scopes…</p>
      )}

      {noScopes && (
        <Alert tone="info" className="mt-4">
          No schemas are configured for this category yet. Open the Admin panel to create one.
        </Alert>
      )}
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      <StepActions>
        <Button
          disabled={categoryId === null || scopeId === null}
          onClick={() =>
            onNext({ categoryId: categoryId as number, scopeId: scopeId as number })
          }
        >
          Continue <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </StepActions>
    </Card>
  );
}
