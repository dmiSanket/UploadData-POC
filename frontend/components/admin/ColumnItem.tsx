"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge, DataTypeBadge } from "@/components/shared/Badge";
import { IconButton } from "@/components/shared/Button";
import type { ColumnDefinition } from "@/lib/types";
import { describeRules } from "@/lib/utils/columnForm";

interface ColumnItemProps {
  column: ColumnDefinition;
  onEdit: () => void;
  onDelete: () => void;
}

/** One column definition: a grid row on desktop, a stacked card on mobile. */
export function ColumnItem({ column, onEdit, onDelete }: ColumnItemProps) {
  const rules = describeRules(column.validationRules);

  return (
    <li className="group grid items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-zinc-50/80 md:grid-cols-[minmax(0,1.3fr)_7rem_7rem_minmax(0,1.6fr)_4.5rem]">
      <div className="flex items-start justify-between gap-2 md:block">
        <span className="break-all font-mono text-sm font-medium text-zinc-900">{column.columnName}</span>
        <span className="flex gap-0.5 md:hidden">
          <IconButton aria-label={`Edit ${column.columnName}`} onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label={`Delete ${column.columnName}`} onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-rose-500" />
          </IconButton>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 md:contents">
        <span>
          <DataTypeBadge dataType={column.dataType} />
        </span>
        <span>
          <Badge tone={column.isRequired ? "required" : "optional"}>
            {column.isRequired ? "Mandatory" : "Optional"}
          </Badge>
        </span>
      </div>

      <p className="min-w-0 truncate text-xs text-zinc-500 md:text-sm" title={rules}>
        {rules}
      </p>

      <span className="hidden justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 md:flex">
        <IconButton aria-label={`Edit ${column.columnName}`} onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label={`Delete ${column.columnName}`} onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-rose-500" />
        </IconButton>
      </span>
    </li>
  );
}

