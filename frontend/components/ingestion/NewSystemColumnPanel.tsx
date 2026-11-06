"use client";

import { useState } from "react";
import { Columns3, Plus } from "lucide-react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Field, INPUT_CLASSES, SELECT_CLASSES } from "@/components/shared/Field";
import { DATA_TYPES, type ColumnInput, type DataType } from "@/lib/types";

interface NewSystemColumnPanelProps {
  headers: string[];
  calculatedNames?: string[];
  onAddColumn: (
    input: ColumnInput,
    mappedHeader: string,
    defaultValue: string,
  ) => Promise<string | null>;
}

/**
 * Lets the user add a new system column to the active FileSchema directly from
 * Step 3 and populate it either from a mapped file/calculated column, a custom
 * default value, or both (file column with fallback default).
 */
export function NewSystemColumnPanel({
  headers,
  calculatedNames = [],
  onAddColumn,
}: NewSystemColumnPanelProps) {
  const [open, setOpen] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [dataType, setDataType] = useState<DataType>("String");
  const [isRequired, setIsRequired] = useState(false);
  const [mappedHeader, setMappedHeader] = useState("");
  const [defaultValue, setDefaultValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setColumnName("");
    setDataType("String");
    setIsRequired(false);
    setMappedHeader("");
    setDefaultValue("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = columnName.trim();
    if (!trimmedName) {
      setError("Please enter a system column name.");
      return;
    }
    if (isRequired && !mappedHeader && !defaultValue.trim()) {
      setError("A mandatory column needs either a mapped file header or a custom default value.");
      return;
    }

    setSaving(true);
    setError(null);
    const err = await onAddColumn(
      {
        columnName: trimmedName,
        dataType,
        isRequired,
        validationRules: null,
      },
      mappedHeader,
      defaultValue.trim(),
    );
    setSaving(false);

    if (err) {
      setError(err);
      return;
    }
    resetForm();
    setOpen(false);
  };

  return (
    <div className="mt-5 rounded-xl border border-dashed border-brand-300 bg-brand-50/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <Columns3 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Need a new system column?</p>
            <p className="text-xs text-zinc-600">
              Add a new column to this schema and populate it with a custom default value or map it from a file column.
            </p>
          </div>
        </div>
        {!open && (
          <Button
            size="sm"
            variant="soft"
            data-testid="open-new-system-col-btn"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add new system column
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-brand-200/70 pt-3.5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="System column name" htmlFor="new-sys-col-name">
              <input
                id="new-sys-col-name"
                className={INPUT_CLASSES}
                placeholder="e.g. warehouse_zone"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
              />
            </Field>
            <Field label="Data type" htmlFor="new-sys-col-type">
              <select
                id="new-sys-col-type"
                className={SELECT_CLASSES}
                value={dataType}
                onChange={(e) => setDataType(e.target.value as DataType)}
              >
                {DATA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fetch data from file column (optional)" htmlFor="new-sys-col-header">
              <select
                id="new-sys-col-header"
                className={SELECT_CLASSES}
                value={mappedHeader}
                onChange={(e) => setMappedHeader(e.target.value)}
              >
                <option value="">— Use custom default value only —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {calculatedNames.includes(h) ? `fx ${h} (calculated)` : h}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <Field
              label={
                mappedHeader
                  ? "Fallback custom default value (used when file cell is blank)"
                  : "Custom default value (applied to all rows)"
              }
              htmlFor="new-sys-col-default"
            >
              <input
                id="new-sys-col-default"
                className={INPUT_CLASSES}
                placeholder={
                  dataType === "Number"
                    ? "e.g. 0 or 100"
                    : dataType === "Boolean"
                      ? "e.g. true or false"
                      : dataType === "Date"
                        ? "e.g. 2026-11-04"
                        : "e.g. MAIN_WAREHOUSE or ACTIVE"
                }
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
              />
            </Field>

            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              />
              Mandatory column
            </label>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving} data-testid="save-new-system-col-btn">
              <Plus className="h-3.5 w-3.5" aria-hidden /> Save & map column
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

