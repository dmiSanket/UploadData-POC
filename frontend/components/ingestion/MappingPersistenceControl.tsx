"use client";

import { useState } from "react";
import clsx from "clsx";
import { BookmarkCheck, Check, Clock, Save } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import type { MappingPersistenceMode } from "@/lib/types";

interface MappingPersistenceControlProps {
  mode: MappingPersistenceMode;
  hasExistingSavedMapping: boolean;
  scopeName: string;
  onModeChange: (mode: MappingPersistenceMode) => void;
  /** Optional immediate save callback (used in Step 3). */
  onSaveNow?: () => Promise<boolean>;
}

/**
 * Lets the user choose whether to use the current mapping & calculated columns
 * only for this upload ("Map for now") or store them in PostgreSQL for future
 * uploads on this scope ("Store this mapping for future use").
 */
export function MappingPersistenceControl({
  mode,
  hasExistingSavedMapping,
  scopeName,
  onModeChange,
  onSaveNow,
}: MappingPersistenceControlProps) {
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSaveNow = async () => {
    if (!onSaveNow) return;
    setSaving(true);
    setJustSaved(false);
    const ok = await onSaveNow();
    setSaving(false);
    if (ok) {
      onModeChange("save");
      setJustSaved(true);
    }
  };

  return (
    <div
      data-testid="mapping-persistence-control"
      className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="h-4 w-4 text-brand-600" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Scope mapping persistence ({scopeName})
          </p>
          {hasExistingSavedMapping && (
            <Badge tone="emerald">Saved template in database</Badge>
          )}
        </div>

        {onSaveNow && (
          <div className="flex items-center gap-2">
            {justSaved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <Check className="h-3.5 w-3.5" aria-hidden /> Saved to database
              </span>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={saving}
              data-testid="save-mapping-now-btn"
              onClick={handleSaveNow}
            >
              <Save className="h-3.5 w-3.5" aria-hidden /> Save mapping to DB now
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          data-testid="persistence-mode-save"
          aria-pressed={mode === "save"}
          onClick={() => onModeChange("save")}
          className={clsx(
            "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
            mode === "save"
              ? "border-brand-600 bg-brand-50/70 ring-1 ring-brand-600"
              : "border-zinc-200 bg-white hover:border-brand-300",
          )}
        >
          <span
            className={clsx(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
              mode === "save"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-zinc-300 bg-white",
            )}
          >
            {mode === "save" && <Check className="h-3 w-3 stroke-[3]" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Store this mapping for future use
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Saves column mappings, calculated columns, and default values in PostgreSQL for this scope so future uploads don&apos;t need re-mapping.
            </p>
          </div>
        </button>

        <button
          type="button"
          data-testid="persistence-mode-now"
          aria-pressed={mode === "now"}
          onClick={() => onModeChange("now")}
          className={clsx(
            "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
            mode === "now"
              ? "border-brand-600 bg-brand-50/70 ring-1 ring-brand-600"
              : "border-zinc-200 bg-white hover:border-brand-300",
          )}
        >
          <span
            className={clsx(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
              mode === "now"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-zinc-300 bg-white",
            )}
          >
            {mode === "now" && <Check className="h-3 w-3 stroke-[3]" />}
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
              <Clock className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
              <span>Map for now (this upload only)</span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Applies this mapping only to the current file upload without changing the saved scope template in the database.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

