"use client";

import { useState } from "react";
import { Plus, Table2, Trash2 } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ScopePills } from "@/components/shared/ScopePills";
import type { UseFileSchemaResult } from "@/hooks/useFileSchema";
import { ColumnForm } from "./ColumnForm";
import { ColumnTable } from "./ColumnTable";

interface SchemaEditorProps {
  categoryName: string;
  scopeName: string;
  state: UseFileSchemaResult;
}

/** Inspector for one schema: target pills, column list, and add-column panel. */
export function SchemaEditor({ categoryName, scopeName, state }: SchemaEditorProps) {
  const { schema, missing, loading, error } = state;
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const heading = `${categoryName} · ${scopeName}`;

  if (loading && !schema) return <p className="p-4 text-sm text-zinc-500">Loading schema…</p>;
  if (error && !schema) return <Alert tone="error">{error}</Alert>;

  if (missing) {
    return (
      <Alert tone="info" title={`No schema exists for ${heading} yet`}>
        <Button className="mt-2" size="sm" onClick={state.createSchema}>
          Create schema
        </Button>
      </Alert>
    );
  }
  if (!schema) return null;

  return (
    <div className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <Card
        label="Inspector"
        icon={<Table2 className="h-4 w-4" />}
        title={heading}
        description={`${schema.columns.length} column${schema.columns.length === 1 ? "" : "s"} · users map their files to these`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5 text-rose-500" aria-hidden /> Delete
            </Button>
            <Button size="sm" onClick={() => setAdding((open) => !open)} aria-expanded={adding}>
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add column
            </Button>
          </div>
        }
      >
        <div className="mb-4 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Applies to Dealers, Locations & Brands
          </p>
          <ScopePills scope={schema.scope} />
        </div>

        <ColumnTable
          columns={schema.columns}
          onUpdate={state.updateColumn}
          onRemove={state.removeColumn}
        />
      </Card>

      {adding && (
        <Card label="New column" title="Add column">
          <ColumnForm onSubmit={state.addColumn} onCancel={() => setAdding(false)} />
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete schema “${heading}”?`}
        description="All of its column definitions and uploaded batches will also be removed."
        confirmLabel="Delete schema"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void state.deleteSchema();
        }}
      />
    </div>
  );
}
