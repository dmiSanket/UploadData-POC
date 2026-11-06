/**
 * Tiny, safe arithmetic formula engine (no eval / Function).
 *
 * Syntax:  [Column Name] references, numbers, + - * / %, unary minus,
 *          parentheses and ABS(x), ROUND(x[, digits]), MIN(...), MAX(...).
 * Example: ([Opening Stock] + [Received]) - [Issued]
 */

export type BinaryOp = "+" | "-" | "*" | "/" | "%";
export type FunctionName = "ABS" | "ROUND" | "MIN" | "MAX";

export type FormulaNode =
  | { kind: "num"; value: number }
  | { kind: "ref"; name: string }
  | { kind: "neg"; arg: FormulaNode }
  | { kind: "bin"; op: BinaryOp; left: FormulaNode; right: FormulaNode }
  | { kind: "call"; name: FunctionName; args: FormulaNode[] };

type Token =
  | { type: "num"; value: number }
  | { type: "ref"; name: string }
  | { type: "op"; value: BinaryOp }
  | { type: "fn"; name: FunctionName }
  | { type: "lparen" | "rparen" | "comma" };

const ARITY: Record<FunctionName, { min: number; max: number }> = {
  ABS: { min: 1, max: 1 },
  ROUND: { min: 1, max: 2 },
  MIN: { min: 1, max: Number.POSITIVE_INFINITY },
  MAX: { min: 1, max: Number.POSITIVE_INFINITY },
};

class FormulaError extends Error {}

function isFunctionName(value: string): value is FunctionName {
  return value in ARITY;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (/\s/.test(char)) {
      i += 1;
    } else if (char === "[") {
      const end = source.indexOf("]", i);
      if (end === -1) throw new FormulaError("Missing closing ] for a column name");
      const name = source.slice(i + 1, end).trim();
      if (!name) throw new FormulaError("Empty column reference []");
      tokens.push({ type: "ref", name });
      i = end + 1;
    } else if (/[0-9.]/.test(char)) {
      const match = /^(\d+\.?\d*|\.\d+)/.exec(source.slice(i));
      if (!match) throw new FormulaError(`Invalid number near "${source.slice(i, i + 6)}"`);
      tokens.push({ type: "num", value: Number(match[0]) });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i)) as RegExpExecArray;
      const word = match[0].toUpperCase();
      const next = source.slice(i + match[0].length).trimStart()[0];
      if (!isFunctionName(word) || next !== "(") {
        throw new FormulaError(
          `Unknown "${match[0]}". Wrap column names in [brackets]; functions: ABS, ROUND, MIN, MAX`,
        );
      }
      tokens.push({ type: "fn", name: word });
      i += match[0].length;
    } else if ("+-*/%".includes(char)) {
      tokens.push({ type: "op", value: char as BinaryOp });
      i += 1;
    } else if (char === "(") {
      tokens.push({ type: "lparen" });
      i += 1;
    } else if (char === ")") {
      tokens.push({ type: "rparen" });
      i += 1;
    } else if (char === ",") {
      tokens.push({ type: "comma" });
      i += 1;
    } else {
      throw new FormulaError(`Unexpected character "${char}"`);
    }
  }
  return tokens;
}

/** Recursive-descent parser: expr -> term -> unary -> primary. */
class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): FormulaNode {
    const node = this.expression();
    if (this.pos < this.tokens.length) throw new FormulaError("Unexpected input after the formula");
    return node;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private expression(): FormulaNode {
    let left = this.term();
    for (let t = this.peek(); t?.type === "op" && (t.value === "+" || t.value === "-"); t = this.peek()) {
      this.pos += 1;
      left = { kind: "bin", op: t.value, left, right: this.term() };
    }
    return left;
  }

  private term(): FormulaNode {
    let left = this.unary();
    for (
      let t = this.peek();
      t?.type === "op" && (t.value === "*" || t.value === "/" || t.value === "%");
      t = this.peek()
    ) {
      this.pos += 1;
      left = { kind: "bin", op: t.value, left, right: this.unary() };
    }
    return left;
  }

  private unary(): FormulaNode {
    const t = this.peek();
    if (t?.type === "op" && (t.value === "-" || t.value === "+")) {
      this.pos += 1;
      const arg = this.unary();
      return t.value === "-" ? { kind: "neg", arg } : arg;
    }
    return this.primary();
  }

  private primary(): FormulaNode {
    const t = this.peek();
    if (!t) throw new FormulaError("The formula ends unexpectedly");
    this.pos += 1;

    if (t.type === "num") return { kind: "num", value: t.value };
    if (t.type === "ref") return { kind: "ref", name: t.name };
    if (t.type === "lparen") {
      const inner = this.expression();
      this.expect("rparen", "Missing closing )");
      return inner;
    }
    if (t.type === "fn") return this.call(t.name);
    throw new FormulaError("Expected a number, a [column] or (");
  }

  private call(name: FunctionName): FormulaNode {
    this.expect("lparen", `${name} must be followed by (`);
    const args: FormulaNode[] = [this.expression()];
    while (this.peek()?.type === "comma") {
      this.pos += 1;
      args.push(this.expression());
    }
    this.expect("rparen", `Missing closing ) for ${name}`);

    const { min, max } = ARITY[name];
    if (args.length < min || args.length > max) {
      throw new FormulaError(`${name} takes ${min === max ? min : `${min}-${max === Infinity ? "n" : max}`} argument(s)`);
    }
    return { kind: "call", name, args };
  }

  private expect(type: "rparen" | "lparen", message: string): void {
    if (this.peek()?.type !== type) throw new FormulaError(message);
    this.pos += 1;
  }
}

export type CompileResult =
  | { ok: true; ast: FormulaNode; references: string[] }
  | { ok: false; error: string };

function collectReferences(node: FormulaNode, into: Set<string>): void {
  switch (node.kind) {
    case "ref":
      into.add(node.name);
      break;
    case "neg":
      collectReferences(node.arg, into);
      break;
    case "bin":
      collectReferences(node.left, into);
      collectReferences(node.right, into);
      break;
    case "call":
      node.args.forEach((arg) => collectReferences(arg, into));
      break;
    case "num":
      break;
  }
}

export function compileFormula(source: string): CompileResult {
  if (!source.trim()) return { ok: false, error: "Enter a formula" };
  try {
    const ast = new Parser(tokenize(source)).parse();
    const references = new Set<string>();
    collectReferences(ast, references);
    if (references.size === 0) return { ok: false, error: "Reference at least one column, e.g. [Qty]" };
    return { ok: true, ast, references: [...references] };
  } catch (error) {
    if (error instanceof FormulaError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Resolves a column name to a number, or null when the cell is blank / not numeric. */
export type ReferenceResolver = (name: string) => number | null;

function applyBinary(op: BinaryOp, a: number, b: number): number | null {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? null : a / b;
    case "%":
      return b === 0 ? null : a % b;
  }
}

function applyFunction(name: FunctionName, args: number[]): number | null {
  switch (name) {
    case "ABS":
      return Math.abs(args[0]);
    case "MIN":
      return Math.min(...args);
    case "MAX":
      return Math.max(...args);
    case "ROUND": {
      const digits = args[1] ?? 0;
      if (!Number.isInteger(digits) || digits < 0 || digits > 10) return null;
      const factor = 10 ** digits;
      return Math.round(args[0] * factor) / factor;
    }
  }
}

function evaluateNode(node: FormulaNode, resolve: ReferenceResolver): number | null {
  switch (node.kind) {
    case "num":
      return node.value;
    case "ref":
      return resolve(node.name);
    case "neg": {
      const value = evaluateNode(node.arg, resolve);
      return value === null ? null : -value;
    }
    case "bin": {
      const left = evaluateNode(node.left, resolve);
      const right = evaluateNode(node.right, resolve);
      return left === null || right === null ? null : applyBinary(node.op, left, right);
    }
    case "call": {
      const values = node.args.map((arg) => evaluateNode(arg, resolve));
      return values.some((v) => v === null) ? null : applyFunction(node.name, values as number[]);
    }
  }
}

/**
 * Evaluates a compiled formula. Returns null (a blank cell) when any input is
 * blank/non-numeric or the result is undefined (e.g. division by zero).
 */
export function evaluateFormula(ast: FormulaNode, resolve: ReferenceResolver): number | null {
  const result = evaluateNode(ast, resolve);
  if (result === null || !Number.isFinite(result)) return null;
  return Number(result.toFixed(8)); // hides float noise such as 0.1 + 0.2
}

