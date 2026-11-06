import { Field, INPUT_CLASSES } from "@/components/shared/Field";
import type { ColumnFormValues } from "@/lib/utils/columnForm";

interface ColumnRulesFieldsProps {
  values: ColumnFormValues;
  onChange: (patch: Partial<ColumnFormValues>) => void;
}

/** Validation-rule inputs that depend on the selected data type. */
export function ColumnRulesFields({ values, onChange }: ColumnRulesFieldsProps) {
  switch (values.dataType) {
    case "String":
      return (
        <>
          <Field label="Regex pattern" htmlFor="col-regex" className="sm:col-span-2">
            <input
              id="col-regex"
              className={`${INPUT_CLASSES} font-mono`}
              placeholder="^[A-Z0-9-]+$"
              value={values.regex}
              onChange={(e) => onChange({ regex: e.target.value })}
            />
          </Field>
          <Field label="Min length" htmlFor="col-minlen">
            <input
              id="col-minlen"
              type="number"
              min={0}
              className={INPUT_CLASSES}
              value={values.minLength}
              onChange={(e) => onChange({ minLength: e.target.value })}
            />
          </Field>
          <Field label="Max length" htmlFor="col-maxlen">
            <input
              id="col-maxlen"
              type="number"
              min={0}
              className={INPUT_CLASSES}
              value={values.maxLength}
              onChange={(e) => onChange({ maxLength: e.target.value })}
            />
          </Field>
        </>
      );
    case "Number":
    case "Date": {
      const inputType = values.dataType === "Number" ? "number" : "date";
      return (
        <>
          <Field label="Min" htmlFor="col-min">
            <input
              id="col-min"
              type={inputType}
              className={INPUT_CLASSES}
              value={values.min}
              onChange={(e) => onChange({ min: e.target.value })}
            />
          </Field>
          <Field label="Max" htmlFor="col-max">
            <input
              id="col-max"
              type={inputType}
              className={INPUT_CLASSES}
              value={values.max}
              onChange={(e) => onChange({ max: e.target.value })}
            />
          </Field>
        </>
      );
    }
    case "Boolean":
      return (
        <p className="text-xs text-slate-500 sm:col-span-2">
          Accepts true/false, yes/no, y/n and 1/0. No extra rules available.
        </p>
      );
  }
}

