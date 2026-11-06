"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { IconButton } from "@/components/shared/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { INPUT_CLASSES } from "@/components/shared/Field";
import type { NamedEntity } from "@/lib/types";

interface CatalogListItemProps {
  item: NamedEntity;
  onRename: (id: number, name: string) => Promise<boolean>;
  onRemove: (id: number) => Promise<boolean>;
}

export function CatalogListItem({ item, onRename, onRemove }: CatalogListItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState(item.name);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed === item.name || (await onRename(item.id, trimmed))) setEditing(false);
  };

  if (editing) {
    return (
      <li className="flex items-center gap-1.5 py-1.5">
        <input
          aria-label={`Rename ${item.name}`}
          className={INPUT_CLASSES}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <IconButton aria-label="Save" variant="soft" onClick={save}>
          <Check className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Cancel" onClick={() => setEditing(false)}>
          <X className="h-4 w-4" />
        </IconButton>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50">
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-[11px] font-semibold uppercase text-brand-700">
          {item.name.slice(0, 1)}
        </span>
        <span className="truncate text-sm font-medium text-zinc-800">{item.name}</span>
      </span>
      <span className="flex gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <IconButton aria-label={`Edit ${item.name}`} onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label={`Delete ${item.name}`} onClick={() => setConfirming(true)}>
          <Trash2 className="h-4 w-4 text-rose-500" />
        </IconButton>
      </span>

      <ConfirmDialog
        open={confirming}
        title={`Delete “${item.name}”?`}
        description="This cannot be undone. Any schemas using this item will also be removed."
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          void onRemove(item.id);
        }}
      />
    </li>
  );
}
