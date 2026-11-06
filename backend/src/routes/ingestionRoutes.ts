import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../lib/HttpError";
import { config } from "../config";
import { ingestBodySchema, idParamSchema } from "../lib/schemas";
import { ingestRows } from "../services/ingestionService";
import { scopeInclude } from "./scopeRoutes";

export const ingestionRouter = Router();

/**
 * Accepts the mapping dictionary ({ schemaColumn: fileHeader }) plus raw rows.
 * 201 on success, 422 with a detailed `errors` array when validation fails.
 */
ingestionRouter.post(
  "/ingest",
  asyncHandler(async (req, res) => {
    const body = ingestBodySchema.parse(req.body);
    if (body.rows.length > config.maxIngestRows) {
      throw new HttpError(413, `Too many rows. Maximum is ${config.maxIngestRows} per upload`);
    }

    if (body.rowNumbers && body.rowNumbers.length !== body.rows.length) {
      throw new HttpError(400, "rowNumbers must have the same length as rows");
    }

    const result = await ingestRows(body);
    res.status(result.success ? 201 : 422).json(result);
  }),
);

ingestionRouter.get(
  "/batches",
  asyncHandler(async (_req, res) => {
    const batches = await prisma.ingestedBatch.findMany({
      orderBy: { uploadDate: "desc" },
      take: 50,
      include: {
        fileSchema: {
          include: {
            category: true,
            scope: { include: scopeInclude },
            columns: { orderBy: [{ position: "asc" }, { id: "asc" }] },
          },
        },
      },
    });
    res.json(batches);
  }),
);

const rowsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

ingestionRouter.get(
  "/batches/:id/rows",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { limit, offset } = rowsQuery.parse(req.query);
    const [rows, total] = await Promise.all([
      prisma.ingestedData.findMany({
        where: { batchId: id },
        orderBy: { rowNumber: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.ingestedData.count({ where: { batchId: id } }),
    ]);
    res.json({ total, rows });
  }),
);

ingestionRouter.delete(
  "/batches/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await prisma.ingestedBatch.delete({ where: { id } });
    res.status(204).end();
  }),
);
