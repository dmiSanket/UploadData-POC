import { z } from "zod";

export const dataTypeSchema = z.enum(["String", "Number", "Date", "Boolean"]);

const rulesShape = z
  .object({
    regex: z.string().max(500).optional(),
    min: z.union([z.number(), z.string()]).optional(),
    max: z.union([z.number(), z.string()]).optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
  })
  .strict();

export const validationRulesSchema = rulesShape.nullable().optional();

export const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

const idArraySchema = z.array(z.number().int().positive()).default([]);

export const scopeBodySchema = z
  .object({
    name: z.string().trim().max(160).optional(),
    dealerIds: idArraySchema,
    locationIds: idArraySchema,
    brandIds: idArraySchema,
  })
  .refine(
    (val) =>
      val.dealerIds.length > 0 ||
      val.locationIds.length > 0 ||
      val.brandIds.length > 0 ||
      Boolean(val.name && val.name.length > 0),
    {
      message: "Select at least one Dealer, Location, or Brand for the scope",
    },
  );

export const columnBodySchema = z
  .object({
    columnName: z.string().trim().min(1, "Column name is required").max(100),
    dataType: dataTypeSchema,
    isRequired: z.boolean().default(false),
    validationRules: validationRulesSchema,
  })
  .superRefine((value, ctx) => {
    const rules = value.validationRules;
    if (!rules) return;
    const fail = (message: string) =>
      ctx.addIssue({ code: "custom", path: ["validationRules"], message });

    if (rules.regex !== undefined) {
      try {
        new RegExp(rules.regex);
      } catch {
        fail("regex is not a valid regular expression");
      }
    }
    if (value.dataType === "Number") {
      if (rules.min !== undefined && typeof rules.min !== "number") fail("min must be a number");
      if (rules.max !== undefined && typeof rules.max !== "number") fail("max must be a number");
    }
    if (value.dataType === "Date") {
      for (const key of ["min", "max"] as const) {
        const bound = rules[key];
        if (bound !== undefined && Number.isNaN(Date.parse(String(bound)))) {
          fail(`${key} must be a valid date`);
        }
      }
    }
    if (value.dataType === "Boolean" && Object.keys(rules).length > 0) {
      fail("Boolean columns do not support validation rules");
    }
  });

export const fileSchemaBodySchema = z.object({
  categoryId: z.number().int().positive(),
  scopeId: z.number().int().positive(),
});

export const computedColumnSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  formula: z.string().trim().min(1).max(500),
  blankAsZero: z.boolean().default(true),
});

export const savedMappingBodySchema = z.object({
  mapping: z.record(z.string(), z.string()).default({}),
  defaultValues: z.record(z.string(), z.string()).default({}),
  computedColumns: z.array(computedColumnSchema).default([]),
});

export const ingestBodySchema = z.object({
  fileSchemaId: z.number().int().positive(),
  /** Optional batchId to append chunked rows to an already-created batch without exceeding serverless payload limits. */
  batchId: z.number().int().positive().optional(),
  mapping: z.record(z.string(), z.string()),
  rows: z.array(z.record(z.string(), z.unknown())).min(1, "No data rows supplied"),
  /** Original spreadsheet row number per entry in `rows` (defaults to index + 2). */
  rowNumbers: z.array(z.number().int().positive()).optional(),
  uploadedBy: z.string().trim().min(1).max(100).default("anonymous"),
  fileName: z.string().max(255).optional(),
  /** When present, stores this mapping + calculated columns on the FileSchema for future uploads. */
  savedMapping: savedMappingBodySchema.optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
