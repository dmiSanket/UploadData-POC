"use client";

import { useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import type { ColumnDefinition, ComputedColumn, ParsedSpreadsheet } from "@/lib/types";
import { ComputedColumnForm, type NewComputedColumn } from "./ComputedColumnForm";

interface ComputedColumnsPanelProps {
  /** Spreadsheet with the existing calculated columns already applied. */
  parsed: ParsedSpreadsheet;
  computed: ComputedColumn[];
  targets: ColumnDefinition[];
  onAdd: (column: NewComputedColumn, targetColumn: string | null) => void;
  onRemove: (id: string) => void;
}

/** Collapsible panel for building new columns from arithmetic on uploaded columns. */
export function ComputedColumnsPanel({
  parsed,
  computed,
  targets,
  onAdd,
  onRemove,
}: ComputedColumnsPanelProps) {
  // Open by default so the column picker, operators and live preview are visible straight away.
  const [adding, setAdding] = useState(true);

  return (
    <Card
      label="Optional"
      icon={<Calculator className="h-4 w-4" />}
      title="Calculated columns"
      description="Need a value that is not in the file? Combine uploaded columns with + − × ÷ (e.g. current stock = Opening + Received − Issued). The result becomes a new column you can map in the next step."
      actions={
        !adding && (
          <Button size="sm" variant="soft" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add calculated column
          </Button>
        )
      }
    >
      {computed.length === 0 && !adding && (
        <p className="text-sm text-zinc-500">No calculated columns yet.</p>
      )}

      {computed.length > 0 && (
        <ul className="mb-3 space-y-2">
          {computed.map((column) => (
            <li
              key={column.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-zinc-900">{column.name}</p>
                <p className="truncate font-mono text-xs text-zinc-500">= {column.formula}</p>
              </div>
              <IconButton aria-label={`Remove ${column.name}`} onClick={() => onRemove(column.id)}>
                <Trash2 className="h-4 w-4 text-rose-500" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <ComputedColumnForm
          parsed={parsed}
          targets={targets}
          onCancel={() => setAdding(false)}
          onAdd={(column, target) => {
            onAdd(column, target);
            setAdding(false);
          }}
        />
      )}
    </Card>
  );
}

