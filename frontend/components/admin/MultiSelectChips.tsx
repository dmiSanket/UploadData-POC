"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Check, Plus } from "lucide-react";
import type { NamedEntity } from "@/lib/types";

type Tone = "brand" | "emerald" | "amber";

interface MultiSelectChipsProps {
  label: string;
  icon: React.ReactNode;
  tone: Tone;
  items: NamedEntity[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onQuickAdd?: (name: string) => Promise<boolean>;
  placeholder?: string;
}

const TONE_SELECTED: Record<Tone, string> = {
  brand: "bg-brand-600 text-white ring-brand-600 shadow-xs",
  emerald: "bg-emerald-600 text-white ring-emerald-600 shadow-xs",
  amber: "bg-amber-500 text-white ring-amber-500 shadow-xs",
};

/**
 * Multi-select pill selector for specific Dealers, Locations, or Brands,
 * with Select All / Clear and an optional inline quick-add input.
 */
export function MultiSelectChips({
  label,
  icon,
  tone,
  items,
  selectedIds,
  onChange,
  onQuickAdd,
  placeholder = "Add new…",
}: MultiSelectChipsProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const selectedSet = new Set(selectedIds);

  const toggle = (id: number) => {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleQuickAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !onQuickAdd) return;
    if (await onQuickAdd(trimmed)) {
      setDraft("");
      setAdding(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-700">
          {icon}
          {label}
          <span className="rounded-full bg-zinc-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
            {selectedIds.length}/{items.length}
          </span>
        </span>
        <div className="flex items-center gap-2 text-xs">
          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => onChange(items.map((i) => i.id))}
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                All
              </button>
              <span className="text-zinc-300">·</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-medium text-zinc-500 hover:text-zinc-800"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => {
          const active = selectedSet.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(item.id)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-all",
                active
                  ? TONE_SELECTED[tone]
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-100 hover:ring-zinc-300",
              )}
            >
              {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              {item.name}
            </button>
          );
        })}

        {onQuickAdd && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-zinc-300 bg-white/70 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-brand-400 hover:text-brand-600"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> New
          </button>
        )}

        {onQuickAdd && adding && (
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              value={draft}
              autoFocus
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleQuickAdd();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              className="h-7 w-36 rounded-lg border border-zinc-300 bg-white px-2 text-xs text-zinc-900 focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleQuickAdd()}
              className="rounded-lg bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-500"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

