import type { ColumnDefinition, ColumnInput, DataType, ValidationRules } from "@/lib/types";

/** All inputs are held as strings so partially typed values never break the form. */
export interface ColumnFormValues {
  columnName: string;
  dataType: DataType;
  isRequired: boolean;
  regex: string;
  minLength: string;
  maxLength: string;
  min: string;
  max: string;
}

export const EMPTY_COLUMN_FORM: ColumnFormValues = {
  columnName: "",
  dataType: "String",
  isRequired: false,
  regex: "",
  minLength: "",
  maxLength: "",
  min: "",
  max: "",
};

export function toFormValues(column: ColumnDefinition): ColumnFormValues {
  const rules = column.validationRules ?? {};
  return {
    columnName: column.columnName,
    dataType: column.dataType,
    isRequired: column.isRequired,
    regex: rules.regex ?? "",
    minLength: rules.minLength?.toString() ?? "",
    maxLength: rules.maxLength?.toString() ?? "",
    min: rules.min?.toString() ?? "",
    max: rules.max?.toString() ?? "",
  };
}

/** Returns a validation message, or null when the form can be submitted. */
export function validateColumnForm(values: ColumnFormValues): string | null {
  if (!values.columnName.trim()) return "Column name is required";

  if (values.regex) {
    try {
      new RegExp(values.regex);
    } catch {
      return "Regex is not a valid regular expression";
    }
  }
  if (values.dataType === "Number") {
    if (values.min && Number.isNaN(Number(values.min))) return "Min must be a number";
    if (values.max && Number.isNaN(Number(values.max))) return "Max must be a number";
    if (values.min && values.max && Number(values.min) > Number(values.max)) {
      return "Min cannot be greater than max";
    }
  }
  if (values.dataType === "String" && values.minLength && values.maxLength) {
    if (Number(values.minLength) > Number(values.maxLength)) {
      return "Min length cannot be greater than max length";
    }
  }
  return null;
}

/** Builds the API payload, including only the rules relevant to the chosen data type. */
export function toColumnInput(values: ColumnFormValues): ColumnInput {
  const rules: ValidationRules = {};

  if (values.dataType === "String") {
    if (values.regex) rules.regex = values.regex;
    if (values.minLength) rules.minLength = Number(values.minLength);
    if (values.maxLength) rules.maxLength = Number(values.maxLength);
  }
  if (values.dataType === "Number") {
    if (values.min) rules.min = Number(values.min);
    if (values.max) rules.max = Number(values.max);
  }
  if (values.dataType === "Date") {
    if (values.min) rules.min = values.min;
    if (values.max) rules.max = values.max;
  }

  return {
    columnName: values.columnName.trim(),
    dataType: values.dataType,
    isRequired: values.isRequired,
    validationRules: Object.keys(rules).length > 0 ? rules : null,
  };
}

/** Short human-readable summary of rules, e.g. "min 1 · max 100". */
export function describeRules(rules: ValidationRules | null): string {
  if (!rules) return "—";
  const parts: string[] = [];
  if (rules.regex) parts.push(`regex ${rules.regex}`);
  if (rules.minLength !== undefined) parts.push(`min length ${rules.minLength}`);
  if (rules.maxLength !== undefined) parts.push(`max length ${rules.maxLength}`);
  if (rules.min !== undefined) parts.push(`min ${rules.min}`);
  if (rules.max !== undefined) parts.push(`max ${rules.max}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

