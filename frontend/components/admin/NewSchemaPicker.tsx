"use client";

import { useState } from "react";
import { Building2, MapPin, Tag } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { Field, INPUT_CLASSES, SELECT_CLASSES } from "@/components/shared/Field";
import { ScopePills } from "@/components/shared/ScopePills";
import type { UseCatalogResult } from "@/hooks/useCatalog";
import type { NamedEntity, ScopeEntity, ScopeInput } from "@/lib/types";
import { MultiSelectChips } from "./MultiSelectChips";
import type { SchemaSelection } from "./SchemaList";

interface NewSchemaPickerProps {
  categories: NamedEntity[];
  scopes: ScopeEntity[];
  dealers: UseCatalogResult;
  locations: UseCatalogResult;
  brands: UseCatalogResult;
  onCreateWithScopeId: (selection: SchemaSelection) => Promise<string | null>;
  onCreateWithComposedScope: (categoryId: number, scopeInput: ScopeInput) => Promise<string | null>;
  onCancel: () => void;
}

export function NewSchemaPicker({
  categories,
  scopes,
  dealers,
  locations,
  brands,
  onCreateWithScopeId,
  onCreateWithComposedScope,
  onCancel,
}: NewSchemaPickerProps) {
  const [categoryId, setCategoryId] = useState("");
  const [mode, setMode] = useState<"compose" | "existing">("compose");
  const [scopeId, setScopeId] = useState("");
  const [customScopeName, setCustomScopeName] = useState("");
  const [dealerIds, setDealerIds] = useState<number[]>([]);
  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [brandIds, setBrandIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasComposedTargets =
    dealerIds.length > 0 || locationIds.length > 0 || brandIds.length > 0;
  const canSubmit =
    Boolean(categoryId) && (mode === "compose" ? hasComposedTargets : Boolean(scopeId));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const failure =
      mode === "compose"
        ? await onCreateWithComposedScope(Number(categoryId), {
            name: customScopeName.trim() || undefined,
            dealerIds,
            locationIds,
            brandIds,
          })
        : await onCreateWithScopeId({
            categoryId: Number(categoryId),
            scopeId: Number(scopeId),
          });
    setSaving(false);
    setError(failure);
  };

  const selectedExistingScope = scopes.find((s) => s.id === Number(scopeId));

  return (
    <Card
      label="New schema"
      title="Create a File Schema"
      description="Pick a document Category, then select specific Dealers, Locations, and/or Brands (or reuse a saved Scope)."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="1. Document Category" htmlFor="new-category">
          <select
            id="new-category"
            required
            className={SELECT_CLASSES}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-zinc-700">
              2. Target Scope (Dealers, Locations & Brands)
            </span>
            <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("compose")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  mode === "compose" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600"
                }`}
              >
                Select Dealers / Locations / Brands
              </button>
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  mode === "existing" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600"
                }`}
              >
                Saved Scopes ({scopes.length})
              </button>
            </div>
          </div>

          {mode === "compose" ? (
            <div className="space-y-3">
              <MultiSelectChips
                label="Specific Dealers"
                icon={<Building2 className="h-3.5 w-3.5 text-brand-600" aria-hidden />}
                tone="brand"
                items={dealers.items}
                selectedIds={dealerIds}
                onChange={setDealerIds}
                onQuickAdd={dealers.add}
                placeholder="New dealer…"
              />
              <MultiSelectChips
                label="Specific Locations"
                icon={<MapPin className="h-3.5 w-3.5 text-emerald-600" aria-hidden />}
                tone="emerald"
                items={locations.items}
                selectedIds={locationIds}
                onChange={setLocationIds}
                onQuickAdd={locations.add}
                placeholder="New location…"
              />
              <MultiSelectChips
                label="Specific Brands"
                icon={<Tag className="h-3.5 w-3.5 text-amber-600" aria-hidden />}
                tone="amber"
                items={brands.items}
                selectedIds={brandIds}
                onChange={setBrandIds}
                onQuickAdd={brands.add}
                placeholder="New brand…"
              />
              <Field
                label="Scope label (optional)"
                htmlFor="new-scope-label"
                hint="Leave blank to auto-name from your selected Dealers, Locations, and Brands."
              >
                <input
                  id="new-scope-label"
                  className={INPUT_CLASSES}
                  placeholder="e.g. West Zone Toyota & Hyundai Dealers"
                  value={customScopeName}
                  onChange={(e) => setCustomScopeName(e.target.value)}
                />
              </Field>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                id="new-scope"
                aria-label="Saved scope"
                required
                className={SELECT_CLASSES}
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
              >
                <option value="">Select a saved scope…</option>
                {scopes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {selectedExistingScope && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="mb-1.5 text-xs font-medium text-zinc-500">Targets in this scope:</p>
                  <ScopePills scope={selectedExistingScope} />
                </div>
              )}
            </div>
          )}
        </div>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!canSubmit}>
            Create schema
          </Button>
        </div>
      </form>
    </Card>
  );
}
