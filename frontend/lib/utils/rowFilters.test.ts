import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ParsedSpreadsheet, RowFilter } from "../types";
import {
  applyRowFilters,
  BLANK_FILTER_LABEL,
  getDistinctValues,
  getFilterLabel,
  getRowFilterKey,
  pruneFiltersForHeaders,
} from "./rowFilters";

const SAMPLE_SHEET: ParsedSpreadsheet = {
  fileName: "dealer_stock.csv",
  headers: ["Dealer", "Location", "Brand", "Current Stock"],
  rows: [
    { Dealer: "Apex Motors", Location: "Mumbai", Brand: "Toyota", "Current Stock": 120 },
    { Dealer: "Apex Motors", Location: "Pune", Brand: "Toyota", "Current Stock": 80 },
    { Dealer: "Metro Auto", Location: "Mumbai", Brand: "Honda", "Current Stock": 45 },
    { Dealer: "Star Wheels", Location: "Delhi", Brand: "Hyundai", "Current Stock": 60 },
    { Dealer: "", Location: "Delhi", Brand: "Toyota", "Current Stock": 15 },
  ],
  rowNumbers: [2, 3, 4, 5, 6],
};

describe("rowFilters", () => {
  it("extracts distinct values with counts for a single column and sorts blanks last", () => {
    const distinct = getDistinctValues(SAMPLE_SHEET.rows, ["Dealer"]);
    assert.deepEqual(distinct, [
      { value: "Apex Motors", count: 2 },
      { value: "Metro Auto", count: 1 },
      { value: "Star Wheels", count: 1 },
      { value: BLANK_FILTER_LABEL, count: 1 },
    ]);
  });

  it("extracts distinct combined tuples when filtering on multiple combined columns", () => {
    const distinct = getDistinctValues(SAMPLE_SHEET.rows, ["Dealer", "Location"]);
    assert.deepEqual(distinct, [
      { value: "(Blank) · Delhi", count: 1 },
      { value: "Apex Motors · Mumbai", count: 1 },
      { value: "Apex Motors · Pune", count: 1 },
      { value: "Metro Auto · Mumbai", count: 1 },
      { value: "Star Wheels · Delhi", count: 1 },
    ]);
    assert.equal(getFilterLabel(["Dealer", "Location"]), "Dealer + Location");
  });

  it("supports multi-select filtering on a single column while preserving 1-based rowNumbers", () => {
    const filters: RowFilter[] = [
      {
        id: "f1",
        columns: ["Dealer"],
        selectedValues: ["Apex Motors", "Star Wheels"],
      },
    ];
    const filtered = applyRowFilters(SAMPLE_SHEET, filters);
    assert.equal(filtered.rows.length, 3);
    assert.deepEqual(filtered.rowNumbers, [2, 3, 5]);
    assert.deepEqual(
      filtered.rows.map((r) => r.Dealer),
      ["Apex Motors", "Apex Motors", "Star Wheels"],
    );
  });

  it("supports filtering on combined columns (multi-column composite keys)", () => {
    const filters: RowFilter[] = [
      {
        id: "f-combo",
        columns: ["Dealer", "Location"],
        selectedValues: ["Apex Motors · Pune", "Metro Auto · Mumbai"],
      },
    ];
    const filtered = applyRowFilters(SAMPLE_SHEET, filters);
    assert.equal(filtered.rows.length, 2);
    assert.deepEqual(filtered.rowNumbers, [3, 4]);
    assert.equal(getRowFilterKey(filtered.rows[0], ["Dealer", "Location"]), "Apex Motors · Pune");
  });

  it("combines multiple active filters with logical AND and ignores filters with empty selections", () => {
    const filters: RowFilter[] = [
      { id: "f1", columns: ["Dealer"], selectedValues: ["Apex Motors", "Metro Auto"] },
      { id: "f2", columns: ["Location"], selectedValues: ["Mumbai"] },
      { id: "f3", columns: ["Brand"], selectedValues: [] }, // inactive
    ];
    const filtered = applyRowFilters(SAMPLE_SHEET, filters);
    assert.equal(filtered.rows.length, 2);
    assert.deepEqual(filtered.rowNumbers, [2, 4]);
  });

  it("also filters on calculated/numeric columns and prunes deleted columns cleanly", () => {
    const filters: RowFilter[] = [
      { id: "f-calc", columns: ["Current Stock"], selectedValues: ["80", "120"] },
    ];
    const filtered = applyRowFilters(SAMPLE_SHEET, filters);
    assert.deepEqual(filtered.rowNumbers, [2, 3]);

    const pruned = pruneFiltersForHeaders(filters, ["Dealer", "Location", "Brand"]);
    assert.equal(pruned.length, 0);
  });
});

