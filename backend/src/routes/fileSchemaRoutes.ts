import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../lib/HttpError";
import {
  columnBodySchema,
  fileSchemaBodySchema,
  idParamSchema,
  savedMappingBodySchema,
} from "../lib/schemas";
import { scopeInclude } from "./scopeRoutes";

const schemaInclude = {
  category: true,
  scope: { include: scopeInclude },
  columns: { orderBy: [{ position: "asc" }, { id: "asc" }] },
} satisfies Prisma.FileSchemaInclude;

const lookupQuery = z.object({
  categoryId: z.coerce.number().int().positive(),
  scopeId: z.coerce.number().int().positive(),
});

function toJsonRules(rules: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return rules ? (rules as Prisma.InputJsonValue) : Prisma.JsonNull;
}

export const fileSchemasRouter = Router();

fileSchemasRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const schemas = await prisma.fileSchema.findMany({
      include: {
        category: true,
        scope: { include: scopeInclude },
        _count: { select: { columns: true } },
      },
      orderBy: [{ category: { name: "asc" } }, { scope: { name: "asc" } }],
    });
    res.json(schemas);
  }),
);

// Declared before "/:id" so "lookup" is not parsed as an id.
fileSchemasRouter.get(
  "/lookup",
  asyncHandler(async (req, res) => {
    const { categoryId, scopeId } = lookupQuery.parse(req.query);
    const schema = await prisma.fileSchema.findUnique({
      where: { categoryId_scopeId: { categoryId, scopeId } },
      include: schemaInclude,
    });
    if (!schema) throw new HttpError(404, "No file schema defined for this category and scope");
    res.json(schema);
  }),
);

fileSchemasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const schema = await prisma.fileSchema.findUnique({ where: { id }, include: schemaInclude });
    if (!schema) throw new HttpError(404, "File schema not found");
    res.json(schema);
  }),
);

fileSchemasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = fileSchemaBodySchema.parse(req.body);
    const created = await prisma.fileSchema.create({ data, include: schemaInclude });
    res.status(201).json(created);
  }),
);

fileSchemasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await prisma.fileSchema.delete({ where: { id } });
    res.status(204).end();
  }),
);

fileSchemasRouter.put(
  "/:id/mapping",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = savedMappingBodySchema.parse(req.body);

    const existing = await prisma.fileSchema.findUnique({
      where: { id },
      include: { columns: true },
    });
    if (!existing) throw new HttpError(404, "File schema not found");

    const validColumnNames = new Set(existing.columns.map((c) => c.columnName));
    const cleanMapping = Object.fromEntries(
      Object.entries(body.mapping).filter(
        ([colName, header]) => validColumnNames.has(colName) && header.trim() !== "",
      ),
    );
    const cleanDefaults = Object.fromEntries(
      Object.entries(body.defaultValues).filter(
        ([colName, val]) => validColumnNames.has(colName) && val.trim() !== "",
      ),
    );

    const savedMappingPayload: Prisma.InputJsonObject = {
      mapping: cleanMapping,
      defaultValues: cleanDefaults,
      computedColumns: body.computedColumns,
      updatedAt: new Date().toISOString(),
    };

    const updated = await prisma.fileSchema.update({
      where: { id },
      data: { savedMapping: savedMappingPayload },
      include: schemaInclude,
    });
    res.json(updated);
  }),
);

fileSchemasRouter.delete(
  "/:id/mapping",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const updated = await prisma.fileSchema.update({
      where: { id },
      data: { savedMapping: Prisma.JsonNull },
      include: schemaInclude,
    });
    res.json(updated);
  }),
);

fileSchemasRouter.post(
  "/:id/columns",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = columnBodySchema.parse(req.body);

    const last = await prisma.columnDefinition.aggregate({
      where: { fileSchemaId: id },
      _max: { position: true },
    });
    const column = await prisma.columnDefinition.create({
      data: {
        fileSchemaId: id,
        columnName: body.columnName,
        dataType: body.dataType,
        isRequired: body.isRequired,
        validationRules: toJsonRules(body.validationRules),
        position: (last._max.position ?? -1) + 1,
      },
    });
    res.status(201).json(column);
  }),
);

export const columnsRouter = Router();

columnsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = columnBodySchema.parse(req.body);
    const column = await prisma.columnDefinition.update({
      where: { id },
      data: {
        columnName: body.columnName,
        dataType: body.dataType,
        isRequired: body.isRequired,
        validationRules: toJsonRules(body.validationRules),
      },
    });
    res.json(column);
  }),
);

columnsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await prisma.columnDefinition.delete({ where: { id } });
    res.status(204).end();
  }),
);
