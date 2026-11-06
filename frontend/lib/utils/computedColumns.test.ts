import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ComputedColumn, ParsedSpreadsheet } from "../types";
import {
  applyComputedColumns,
  checkFormula,
  evaluateColumn,
  removeComputedColumn,
  validateComputedColumn,
} from "./computedColumns";
import { compileFormula, evaluateFormula } from "./formula";

/**
 * Formulas must reference a column, so pure-arithmetic cases get a harmless
 * `+ [zero]` (always 0) appended; the parentheses keep precedence intact.
 */
function run(formula: string, values: Record<string, number | null> = {}): number | null {
  const compiled = compileFormula(`(${formula}) + [zero]`);
  if (!compiled.ok) throw new Error(compiled.error);
  const inputs: Record<string, number | null> = { zero: 0, ...values };
  return evaluateFormula(compiled.ast, (name) => inputs[name] ?? null);
}

describe("formula engine", () => {
  it("respects operator precedence, parentheses and unary minus", () => {
    assert.equal(run("2 + 3 * 4"), 14);
    assert.equal(run("(2 + 3) * 4"), 20);
    assert.equal(run("-[a] + 10", { a: 4 }), 6);
    assert.equal(run("10 - 2 - 3"), 5); // left-associative
    assert.equal(run("7 % 4"), 3);
  });

  it("reads column references including spaces", () => {
    assert.equal(run("[Opening Stock] + [Received] - [Issued]", { "Opening Stock": 100, Received: 40, Issued: 25 }), 115);
  });

  it("supports functions", () => {
    assert.equal(run("ROUND(10 / 3, 2)"), 3.33);
    assert.equal(run("ABS(-5)"), 5);
    assert.equal(run("MAX([a], [b], 7)", { a: 1, b: 9 }), 9);
    assert.equal(run("MIN([a], [b])", { a: 1, b: 9 }), 1);
  });

  it("returns null for blanks, division by zero and hides float noise", () => {
    assert.equal(run("[a] + 1", { a: null }), null);
    assert.equal(run("5 / 0"), null);
    assert.equal(run("0.1 + 0.2"), 0.3);
  });

  it("reports readable errors", () => {
    assert.equal(compileFormula("").ok, false);
    assert.equal(compileFormula("[a] +").ok, false);
    assert.equal(compileFormula("(1 + 2").ok, false);
    assert.equal(compileFormula("Stock + 1").ok, false); // missing brackets
    assert.equal(compileFormula("ROUND()").ok, false);
    assert.equal(compileFormula("1 + 2").ok, false); // no column referenced
    assert.equal(compileFormula("[a] $ 2").ok, false);
  });

  it("never executes arbitrary code", () => {
    assert.equal(compileFormula("process.exit(1)").ok, false);
    assert.equal(compileFormula("[a]; alert(1)").ok, false);
  });
});

const parsed: ParsedSpreadsheet = {
  fileName: "stock.csv",
  headers: ["Item", "Opening", "Received", "Issued"],
  rows: [
    { Item: "A", Opening: 100, Received: 40, Issued: 25 },
    { Item: "B", Opening: "1,000", Received: null, Issued: "5" },
    { Item: "C", Opening: "n/a", Received: 1, Issued: 1 },
  ],
  rowNumbers: [2, 3, 5],
};

const stock: ComputedColumn = {
  id: "1",
  name: "current_stock",
  formula: "[Opening] + [Received] - [Issued]",
  blankAsZero: true,
};

describe("computed columns", () => {
  it("adds the result column, coercing numeric strings and blanks", () => {
    const result = applyComputedColumns(parsed, [stock]);
    assert.deepEqual(result.headers, [...parsed.headers, "current_stock"]);
    assert.deepEqual(
      result.rows.map((r) => r.current_stock),
      [115, 995, null], // "n/a" is not numeric -> blank
    );
    assert.deepEqual(result.rowNumbers, parsed.rowNumbers);
  });

  it("makes blanks propagate when blankAsZero is off", () => {
    const values = evaluateColumn(parsed.rows, { formula: stock.formula, blankAsZero: false });
    assert.deepEqual(values, [115, null, null]);
  });

  it("lets later columns use earlier results and drops dependents on removal", () => {
    const doubled: ComputedColumn = { id: "2", name: "double", formula: "[current_stock] * 2", blankAsZero: true };
    const chained = applyComputedColumns(parsed, [stock, doubled]);
    assert.equal(chained.rows[0].double, 230);

    const { remaining, removedNames } = removeComputedColumn([stock, doubled], "1");
    assert.deepEqual(remaining, []);
    assert.deepEqual(removedNames, ["current_stock", "double"]);
  });

  it("validates names and references", () => {
    assert.match(validateComputedColumn({ name: "", formula: "[Opening]" }, parsed.headers) ?? "", /name/i);
    assert.match(validateComputedColumn({ name: "opening", formula: "[Opening]" }, parsed.headers) ?? "", /already exists/);
    assert.match(checkFormula("[Missing] + 1", parsed.headers) ?? "", /Unknown column/);
    assert.equal(validateComputedColumn(stock, parsed.headers), null);
  });
});
