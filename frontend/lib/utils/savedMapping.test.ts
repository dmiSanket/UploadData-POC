import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ColumnDefinition, ParsedSpreadsheet, SavedMappingConfig } from "../types";
import { resolveSavedMapping } from "./savedMapping";

const COLUMNS: ColumnDefinition[] = [
  {
    id: 1,
    fileSchemaId: 1,
    columnName: "part_number",
    dataType: "String",
    isRequired: true,
    validationRules: null,
    position: 0,
  },
  {
    id: 2,
    fileSchemaId: 1,
    columnName: "quantity",
    dataType: "Number",
    isRequired: true,
    validationRules: null,
    position: 1,
  },
  {
    id: 3,
    fileSchemaId: 1,
    columnName: "warehouse_zone",
    dataType: "String",
    isRequired: false,
    validationRules: null,
    position: 2,
  },
];

const PARSED: ParsedSpreadsheet = {
  fileName: "upload.csv",
  headers: ["Vendor SKU", "Opening", "Received", "Issued"],
  rows: [{ "Vendor SKU": "SKU-99", Opening: 10, Received: 5, Issued: 2 }],
  rowNumbers: [2],
};

describe("resolveSavedMapping", () => {
  it("restores saved calculated columns, custom header mappings, and default values", () => {
    const saved: SavedMappingConfig = {
      mapping: {
        part_number: "Vendor SKU",
        quantity: "Current Stock",
      },
      defaultValues: {
        warehouse_zone: "NORTH-DEPOT",
      },
      computedColumns: [
        {
          id: "c1",
          name: "Current Stock",
          formula: "[Opening] + [Received] - [Issued]",
          blankAsZero: true,
        },
      ],
    };

    const resolved = resolveSavedMapping(PARSED, COLUMNS, saved);
    assert.equal(resolved.appliedFromDb, true);
    assert.equal(resolved.restoredComputedCount, 1);
    assert.equal(resolved.restoredMappedCount, 2);
    assert.equal(resolved.restoredDefaultCount, 1);
    assert.deepEqual(resolved.mapping, {
      part_number: "Vendor SKU",
      quantity: "Current Stock",
      warehouse_zone: "",
    });
    assert.deepEqual(resolved.defaultValues, {
      warehouse_zone: "NORTH-DEPOT",
    });
  });

  it("skips saved calculated columns whose referenced columns do not exist in the file", () => {
    const saved: SavedMappingConfig = {
      mapping: { part_number: "NonExistentHeader" },
      defaultValues: {},
      computedColumns: [
        {
          id: "c1",
          name: "Current Stock",
          formula: "[MissingColA] + [MissingColB]",
          blankAsZero: true,
        },
      ],
    };

    const resolved = resolveSavedMapping(PARSED, COLUMNS, saved);
    assert.equal(resolved.appliedFromDb, false);
    assert.equal(resolved.restoredComputedCount, 0);
    assert.equal(resolved.restoredMappedCount, 0);
  });
});

