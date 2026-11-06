import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ColumnDefinition, ParsedSpreadsheet } from "../types";
import { missingRequired } from "./autoMap";
import { prepareIngestionPayload } from "./prepareIngestionPayload";

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
    isRequired: true,
    validationRules: null,
    position: 2,
  },
  {
    id: 4,
    fileSchemaId: 1,
    columnName: "brand_name",
    dataType: "String",
    isRequired: false,
    validationRules: null,
    position: 3,
  },
];

const PARSED: ParsedSpreadsheet = {
  fileName: "stock.csv",
  headers: ["PartNo", "Current Stock", "Brand"],
  rows: [
    { PartNo: "AB-101", "Current Stock": 60, Brand: "Toyota" },
    { PartNo: "AB-102", "Current Stock": 40, Brand: "" },
  ],
  rowNumbers: [2, 5],
};

describe("prepareIngestionPayload & missingRequired with defaultValues", () => {
  it("satisfies required columns when either a file header OR a custom default value is provided", () => {
    const mapping = { part_number: "PartNo", quantity: "Current Stock", warehouse_zone: "" };
    assert.deepEqual(missingRequired(COLUMNS, mapping, {}), ["warehouse_zone"]);
    assert.deepEqual(missingRequired(COLUMNS, mapping, { warehouse_zone: "WEST-HUB" }), []);
  });

  it("populates pure default columns, fallback default values for blank cells, and tracks cell sources", () => {
    const mapping = {
      part_number: "PartNo",
      quantity: "Current Stock",
      warehouse_zone: "",
      brand_name: "Brand",
    };
    const defaultValues = {
      warehouse_zone: "WEST-HUB",
      brand_name: "GenericBrand",
    };

    const prepared = prepareIngestionPayload(
      COLUMNS,
      PARSED,
      mapping,
      defaultValues,
      ["Current Stock"],
    );

    assert.equal(prepared.previewRows.length, 2);
    assert.equal(prepared.previewRows[0].rowNumber, 2);
    assert.deepEqual(prepared.previewRows[0].cells, {
      part_number: { value: "AB-101", source: "file" },
      quantity: { value: 60, source: "calculated" },
      warehouse_zone: { value: "WEST-HUB", source: "default" },
      brand_name: { value: "Toyota", source: "file" },
    });

    // Row 2 (rowNumber 5) has blank Brand -> falls back to "GenericBrand" with source "default"
    assert.equal(prepared.previewRows[1].rowNumber, 5);
    assert.deepEqual(prepared.previewRows[1].cells, {
      part_number: { value: "AB-102", source: "file" },
      quantity: { value: 40, source: "calculated" },
      warehouse_zone: { value: "WEST-HUB", source: "default" },
      brand_name: { value: "GenericBrand", source: "default" },
    });

    // And the synthetic headers exist in `prepared.rows` for every mapped entry in `prepared.mapping`
    for (const [, header] of Object.entries(prepared.mapping)) {
      assert.ok(header in prepared.rows[0]);
      assert.ok(header in prepared.rows[1]);
    }
  });
});

