import type { CellValue, ColumnRule, ValidationRules } from "../types";

export type CoerceResult =
  | { ok: true; value: CellValue }
  | { ok: false; message: string };

const TRUE_VALUES = new Set(["true", "yes", "y", "1"]);
const FALSE_VALUES = new Set(["false", "no", "n", "0"]);

/** True for null, undefined and whitespace-only strings. */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === "string" && value.trim() === "";
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  // Require a leading ISO-like yyyy-mm-dd to avoid Date.parse accepting junk such as "abc 1".
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function coerceNumber(value: unknown): CoerceResult {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { ok: true, value }
      : { ok: false, message: "Expected a finite number" };
  }
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/,/g, "");
    if (cleaned !== "" && Number.isFinite(Number(cleaned))) {
      return { ok: true, value: Number(cleaned) };
    }
  }
  return { ok: false, message: "Expected a number" };
}

function coerceBoolean(value: unknown): CoerceResult {
  if (typeof value === "boolean") return { ok: true, value };
  const key = String(value).trim().toLowerCase();
  if (TRUE_VALUES.has(key)) return { ok: true, value: true };
  if (FALSE_VALUES.has(key)) return { ok: true, value: false };
  return { ok: false, message: "Expected a boolean (true/false, yes/no, 1/0)" };
}

function coerceDate(value: unknown): CoerceResult {
  const date = toDate(value);
  if (!date) return { ok: false, message: "Expected a date (YYYY-MM-DD or ISO 8601)" };
  return { ok: true, value: date.toISOString() };
}

function checkString(value: string, rules: ValidationRules): string | null {
  if (rules.minLength !== undefined && value.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }
  if (rules.maxLength !== undefined && value.length > rules.maxLength) {
    return `Must be at most ${rules.maxLength} characters`;
  }
  if (rules.regex !== undefined && !new RegExp(rules.regex).test(value)) {
    return `Does not match required pattern ${rules.regex}`;
  }
  return null;
}

function checkNumber(value: number, rules: ValidationRules): string | null {
  if (typeof rules.min === "number" && value < rules.min) return `Must be >= ${rules.min}`;
  if (typeof rules.max === "number" && value > rules.max) return `Must be <= ${rules.max}`;
  return null;
}

function checkDate(isoValue: string, rules: ValidationRules): string | null {
  const time = new Date(isoValue).getTime();
  const min = rules.min !== undefined ? toDate(rules.min) : null;
  const max = rules.max !== undefined ? toDate(rules.max) : null;
  if (min && time < min.getTime()) return `Must be on or after ${String(rules.min)}`;
  if (max && time > max.getTime()) return `Must be on or before ${String(rules.max)}`;
  return null;
}

/**
 * Validates one cell against a column definition and returns the coerced value.
 * Empty cells are valid unless the column is required (they are stored as null).
 */
export function validateCell(raw: unknown, column: ColumnRule): CoerceResult {
  if (isEmpty(raw)) {
    return column.isRequired
      ? { ok: false, message: "Required value is missing" }
      : { ok: true, value: null };
  }

  const rules = column.validationRules ?? {};

  switch (column.dataType) {
    case "Number": {
      const result = coerceNumber(raw);
      if (!result.ok) return result;
      const message = checkNumber(result.value as number, rules);
      return message ? { ok: false, message } : result;
    }
    case "Boolean":
      return coerceBoolean(raw);
    case "Date": {
      const result = coerceDate(raw);
      if (!result.ok) return result;
      const message = checkDate(result.value as string, rules);
      return message ? { ok: false, message } : result;
    }
    case "String": {
      const text = String(raw).trim();
      const message = checkString(text, rules);
      return message ? { ok: false, message } : { ok: true, value: text };
    }
  }
}

