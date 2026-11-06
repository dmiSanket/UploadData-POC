"use client";

import { useState } from "react";
import { Columns3 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ColumnDefinition, ColumnInput } from "@/lib/types";
import { ColumnForm } from "./ColumnForm";
import { ColumnItem } from "./ColumnItem";

interface ColumnTableProps {
  columns: ColumnDefinition[];
  onUpdate: (columnId: number, input: ColumnInput) => Promise<string | null>;
  onRemove: (columnId: number) => Promise<unknown>;
}

export function ColumnTable({ columns, onUpdate, onRemove }: ColumnTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ColumnDefinition | null>(null);

  if (columns.length === 0) {
    return (
      <EmptyState
        icon={<Columns3 className="h-5 w-5" />}
        title="No columns yet"
        description="Add the first column to define what uploaded files must contain."
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="hidden grid-cols-[minmax(0,1.3fr)_7rem_7rem_minmax(0,1.6fr)_4.5rem] gap-x-4 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 md:grid">
          <span>Column</span>
          <span>Type</span>
          <span>Required</span>
          <span>Rules</span>
          <span />
        </div>
        <ul className="divide-y divide-zinc-100">
          {columns.map((column) =>
            editingId === column.id ? (
              <li key={column.id} className="bg-brand-50/40 p-4">
                <ColumnForm
                  column={column}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (input) => {
                    const failure = await onUpdate(column.id, input);
                    if (!failure) setEditingId(null);
                    return failure;
                  }}
                />
              </li>
            ) : (
              <ColumnItem
                key={column.id}
                column={column}
                onEdit={() => setEditingId(column.id)}
                onDelete={() => setPendingDelete(column)}
              />
            ),
          )}
        </ul>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Remove “${pendingDelete?.columnName}”?`}
        description="Uploads will no longer be mapped to or validated against this column."
        confirmLabel="Remove column"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void onRemove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
