"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { INPUT_CLASSES } from "@/components/shared/Field";
import type { UseCatalogResult } from "@/hooks/useCatalog";
import { CatalogListItem } from "./CatalogListItem";

interface CatalogPanelProps {
  catalog: UseCatalogResult;
  label: string;
  title: string;
  description: string;
  placeholder: string;
  icon: React.ReactNode;
}

export function CatalogPanel({ catalog, label, title, description, placeholder, icon }: CatalogPanelProps) {
  const { items, loading, error, add, rename, remove } = catalog;
  const [name, setName] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (await add(name.trim())) setName("");
  };

  return (
    <Card label={label} icon={icon} title={title} description={description}>
      <form onSubmit={submit} className="flex gap-2">
        <input
          aria-label={`New ${title} name`}
          className={INPUT_CLASSES}
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={!name.trim()}>
          <Plus className="h-4 w-4" aria-hidden /> Add
        </Button>
      </form>

      {error && <Alert tone="error" className="mt-3">{error}</Alert>}

      {loading && <p className="mt-4 text-sm text-zinc-500">Loading…</p>}
      {!loading && items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
          Nothing here yet — add your first one above.
        </p>
      )}
      <ul className="mt-3 space-y-0.5">
        {items.map((item) => (
          <CatalogListItem key={item.id} item={item} onRename={rename} onRemove={remove} />
        ))}
      </ul>
    </Card>
  );
}
