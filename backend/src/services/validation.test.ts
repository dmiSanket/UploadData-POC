import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ColumnRule } from "../types";
import { validateCell } from "./cellValidator";
import { findUnmappedRequired, mapAndValidateRows } from "./rowMapper";

const col = (over: Partial<ColumnRule> & Pick<ColumnRule, "dataType">): ColumnRule => ({
  columnName: "c",
  isRequired: false,
  validationRules: null,
  ...over,
});

describe("validateCell", () => {
  it("flags missing required values and nulls optional ones", () => {
    assert.equal(validateCell("  ", col({ dataType: "String", isRequired: true })).ok, false);
    assert.deepEqual(validateCell(undefined, col({ dataType: "String" })), { ok: true, value: null });
  });

  it("coerces numbers from strings and enforces min/max", () => {
    const rule = col({ dataType: "Number", validationRules: { min: 1, max: 10 } });
    assert.deepEqual(validateCell("5", rule), { ok: true, value: 5 });
    assert.deepEqual(validateCell("1,000", col({ dataType: "Number" })), { ok: true, value: 1000 });
    assert.equal(validateCell(0, rule).ok, false);
    assert.equal(validateCell(11, rule).ok, false);
    assert.equal(validateCell("abc", rule).ok, false);
  });

  it("enforces regex and length on strings", () => {
    const rule = col({ dataType: "String", validationRules: { regex: "^[A-Z]{2}-\\d+$", maxLength: 8 } });
    assert.equal(validateCell("AB-123", rule).ok, true);
    assert.equal(validateCell("ab-123", rule).ok, false);
    assert.equal(validateCell("AB-123456", rule).ok, false);
  });

  it("parses booleans", () => {
    const rule = col({ dataType: "Boolean" });
    assert.deepEqual(validateCell("Yes", rule), { ok: true, value: true });
    assert.deepEqual(validateCell(0, rule), { ok: true, value: false });
    assert.equal(validateCell("maybe", rule).ok, false);
  });

  it("parses ISO dates and enforces bounds", () => {
    const rule = col({ dataType: "Date", validationRules: { min: "2024-01-01" } });
    assert.equal(validateCell("2024-05-01", rule).ok, true);
    assert.equal(validateCell("2023-12-31", rule).ok, false);
    assert.equal(validateCell("not a date", rule).ok, false);
  });
});

describe("mapAndValidateRows", () => {
  const columns: ColumnRule[] = [
    { columnName: "part_number", dataType: "String", isRequired: true, validationRules: null },
    { columnName: "qty", dataType: "Number", isRequired: true, validationRules: { min: 1 } },
    { columnName: "note", dataType: "String", isRequired: false, validationRules: null },
  ];
  const mapping = { part_number: "PartNum", qty: "Quantity" };

  it("swaps keys and reports row/column errors with spreadsheet row numbers", () => {
    const result = mapAndValidateRows(
      [
        { PartNum: "A1", Quantity: 2, Ignored: "x" },
        { PartNum: "", Quantity: 0 },
      ],
      columns,
      mapping,
    );
    assert.deepEqual(result.validRows, [
      { rowNumber: 2, data: { part_number: "A1", qty: 2, note: null } },
    ]);
    assert.equal(result.totalErrors, 2);
    assert.deepEqual(
      result.errors.map((e) => [e.row, e.column]),
      [[3, "part_number"], [3, "qty"]],
    );
  });

  it("finds unmapped required columns", () => {
    assert.deepEqual(findUnmappedRequired(columns, { part_number: "PartNum" }), ["qty"]);
  });
});

