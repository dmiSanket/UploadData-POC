"use client";

import { useState } from "react";
import { Building2, Layers, MapPin, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button, IconButton } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Field, INPUT_CLASSES } from "@/components/shared/Field";
import { ScopePills } from "@/components/shared/ScopePills";
import type { UseCatalogResult } from "@/hooks/useCatalog";
import type { UseScopesResult } from "@/hooks/useScopes";
import type { ScopeEntity } from "@/lib/types";
import { MultiSelectChips } from "./MultiSelectChips";

interface ScopeBuilderPanelProps {
  scopesState: UseScopesResult;
  dealers: UseCatalogResult;
  locations: UseCatalogResult;
  brands: UseCatalogResult;
}

export function ScopeBuilderPanel({
  scopesState,
  dealers,
  locations,
  brands,
}: ScopeBuilderPanelProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [dealerIds, setDealerIds] = useState<number[]>([]);
  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [brandIds, setBrandIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ScopeEntity | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDealerIds([]);
    setLocationIds([]);
    setBrandIds([]);
  };

  const startEdit = (scope: ScopeEntity) => {
    setEditingId(scope.id);
    setName(scope.name);
    setDealerIds(scope.dealers.map((d) => d.id));
    setLocationIds(scope.locations.map((l) => l.id));
    setBrandIds(scope.brands.map((b) => b.id));
  };

  const hasSelection =
    dealerIds.length > 0 || locationIds.length > 0 || brandIds.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasSelection) return;
    setSaving(true);
    const payload = {
      name: name.trim() || undefined,
      dealerIds,
      locationIds,
      brandIds,
    };
    const ok = editingId
      ? await scopesState.update(editingId, payload)
      : Boolean(await scopesState.create(payload));
    setSaving(false);
    if (ok) resetForm();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-6">
      <Card
        label={editingId ? "Edit scope" : "Compose scope"}
        icon={<Layers className="h-4 w-4" />}
        title={editingId ? "Update target combination" : "Build a target Scope"}
        description="Select one or multiple specific Dealers, Locations, and/or Brands to form a reusable Scope."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultiSelectChips
            label="Dealers"
            icon={<Building2 className="h-3.5 w-3.5 text-brand-600" aria-hidden />}
            tone="brand"
            items={dealers.items}
            selectedIds={dealerIds}
            onChange={setDealerIds}
            onQuickAdd={dealers.add}
            placeholder="New dealer…"
          />

          <MultiSelectChips
            label="Locations"
            icon={<MapPin className="h-3.5 w-3.5 text-emerald-600" aria-hidden />}
            tone="emerald"
            items={locations.items}
            selectedIds={locationIds}
            onChange={setLocationIds}
            onQuickAdd={locations.add}
            placeholder="New location…"
          />

          <MultiSelectChips
            label="Brands"
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
            htmlFor="scope-custom-name"
            hint="Leave blank to auto-generate a descriptive name from the selected targets."
          >
            <input
              id="scope-custom-name"
              className={INPUT_CLASSES}
              placeholder="e.g. West Zone Toyota & Hyundai Dealers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          {scopesState.error && <Alert tone="error">{scopesState.error}</Alert>}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            {editingId && (
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={saving} disabled={!hasSelection}>
              <Plus className="h-4 w-4" aria-hidden />
              {editingId ? "Save scope" : "Create scope"}
            </Button>
          </div>
        </form>
      </Card>

      <Card
        label="Saved scopes"
        icon={<Layers className="h-4 w-4" />}
        title={`Configured Scopes (${scopesState.scopes.length})`}
        description="Each scope can be paired with any Category in the Schema Builder."
      >
        {scopesState.loading && <p className="text-sm text-zinc-500">Loading scopes…</p>}
        {!scopesState.loading && scopesState.scopes.length === 0 && (
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title="No scopes created yet"
            description="Pick specific Dealers, Locations, or Brands on the left to create one."
          />
        )}
        <ul className="space-y-3">
          {scopesState.scopes.map((scope) => (
            <li
              key={scope.id}
              className="group rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{scope.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {scope.dealers.length} dealer{scope.dealers.length === 1 ? "" : "s"} ·{" "}
                    {scope.locations.length} location{scope.locations.length === 1 ? "" : "s"} ·{" "}
                    {scope.brands.length} brand{scope.brands.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="flex shrink-0 gap-0.5">
                  <IconButton aria-label={`Edit ${scope.name}`} onClick={() => startEdit(scope)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    aria-label={`Delete ${scope.name}`}
                    onClick={() => setPendingDelete(scope)}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </IconButton>
                </span>
              </div>
              <ScopePills scope={scope} compact className="mt-2.5" />
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete scope “${pendingDelete?.name}”?`}
        description="Any File Schemas and uploaded batches attached to this scope will also be deleted."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void scopesState.remove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

