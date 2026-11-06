"use client";

import { useState } from "react";
import { Alert } from "@/components/shared/Alert";
import { Button } from "@/components/shared/Button";
import { Field, INPUT_CLASSES, SELECT_CLASSES } from "@/components/shared/Field";
import { DATA_TYPES, type ColumnDefinition, type ColumnInput, type DataType } from "@/lib/types";
import {
  EMPTY_COLUMN_FORM,
  toColumnInput,
  toFormValues,
  validateColumnForm,
  type ColumnFormValues,
} from "@/lib/utils/columnForm";
import { ColumnRulesFields } from "./ColumnRulesFields";

interface ColumnFormProps {
  /** When provided the form edits this column, otherwise it creates a new one. */
  column?: ColumnDefinition;
  onSubmit: (input: ColumnInput) => Promise<string | null>;
  onCancel?: () => void;
}

export function ColumnForm({ column, onSubmit, onCancel }: ColumnFormProps) {
  const [values, setValues] = useState<ColumnFormValues>(
    column ? toFormValues(column) : EMPTY_COLUMN_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const patch = (changes: Partial<ColumnFormValues>) =>
    setValues((current) => ({ ...current, ...changes }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validateColumnForm(values);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    const failure = await onSubmit(toColumnInput(values));
    setSaving(false);

    if (failure) {
      setError(failure);
      return;
    }
    setError(null);
    if (!column) setValues(EMPTY_COLUMN_FORM);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Column name" htmlFor="col-name" hint="Key used in stored data, e.g. part_number">
        <input
          id="col-name"
          className={INPUT_CLASSES}
          value={values.columnName}
          onChange={(e) => patch({ columnName: e.target.value })}
        />
      </Field>

      <Field label="Data type" htmlFor="col-type">
        <select
          id="col-type"
          className={SELECT_CLASSES}
          value={values.dataType}
          onChange={(e) =>
            patch({ dataType: e.target.value as DataType, regex: "", minLength: "", maxLength: "", min: "", max: "" })
          }
        >
          {DATA_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      <ColumnRulesFields values={values} onChange={patch} />

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 sm:col-span-2">
        <span>
          <span className="block text-sm font-medium text-zinc-800">Mandatory column</span>
          <span className="block text-xs text-zinc-500">Uploads must map this column and fill every row.</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={values.isRequired}
          onChange={(e) => patch({ isRequired: e.target.checked })}
        />
        <span
          aria-hidden
          className="relative h-6 w-11 shrink-0 rounded-full bg-zinc-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-brand-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-accent/30"
        />
      </label>

      {error && <Alert tone="error" className="sm:col-span-2">{error}</Alert>}

      <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={saving}>
          {column ? "Save changes" : "Add column"}
        </Button>
      </div>
    </form>
  );
}

