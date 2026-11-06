import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { HttpError } from "../lib/HttpError";
import { idParamSchema, scopeBodySchema } from "../lib/schemas";

export const scopeInclude = {
  dealers: { orderBy: { name: "asc" } },
  locations: { orderBy: { name: "asc" } },
  brands: { orderBy: { name: "asc" } },
  _count: { select: { fileSchemas: true } },
} satisfies Prisma.ScopeInclude;

const scopeListQuery = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
});

function summarizeNames(items: { name: string }[]): string {
  if (items.length === 0) return "";
  if (items.length <= 2) return items.map((i) => i.name).join(", ");
  return `${items[0].name}, ${items[1].name} +${items.length - 2}`;
}

async function resolveScopeName(
  customName: string | undefined,
  dealerIds: number[],
  locationIds: number[],
  brandIds: number[],
): Promise<string> {
  if (customName && customName.trim().length > 0) {
    return customName.trim();
  }
  const [dealers, locations, brands] = await Promise.all([
    dealerIds.length > 0
      ? prisma.dealer.findMany({ where: { id: { in: dealerIds } }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    locationIds.length > 0
      ? prisma.location.findMany({ where: { id: { in: locationIds } }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    brandIds.length > 0
      ? prisma.brand.findMany({ where: { id: { in: brandIds } }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  const parts = [summarizeNames(dealers), summarizeNames(locations), summarizeNames(brands)].filter(Boolean);
  if (parts.length === 0) {
    throw new HttpError(400, "Select at least one Dealer, Location, or Brand");
  }
  return parts.join(" · ");
}

function sameIdSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

export const scopesRouter = Router();

scopesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { categoryId } = scopeListQuery.parse(req.query);
    const scopes = await prisma.scope.findMany({
      where: categoryId ? { fileSchemas: { some: { categoryId } } } : undefined,
      include: scopeInclude,
      orderBy: { name: "asc" },
    });
    res.json(scopes);
  }),
);

scopesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = scopeBodySchema.parse(req.body);
    const dealerIds = [...new Set(body.dealerIds)];
    const locationIds = [...new Set(body.locationIds)];
    const brandIds = [...new Set(body.brandIds)];

    // If no custom name was given and a scope with the exact same combination of
    // dealers + locations + brands already exists, return that existing scope.
    if (!body.name?.trim()) {
      const existingAll = await prisma.scope.findMany({ include: scopeInclude });
      const exactMatch = existingAll.find(
        (s) =>
          sameIdSet(
            s.dealers.map((d) => d.id),
            dealerIds,
          ) &&
          sameIdSet(
            s.locations.map((l) => l.id),
            locationIds,
          ) &&
          sameIdSet(
            s.brands.map((b) => b.id),
            brandIds,
          ),
      );
      if (exactMatch) {
        res.status(200).json(exactMatch);
        return;
      }
    }

    const name = await resolveScopeName(body.name, dealerIds, locationIds, brandIds);
    const created = await prisma.scope.create({
      data: {
        name,
        dealers: { connect: dealerIds.map((id) => ({ id })) },
        locations: { connect: locationIds.map((id) => ({ id })) },
        brands: { connect: brandIds.map((id) => ({ id })) },
      },
      include: scopeInclude,
    });
    res.status(201).json(created);
  }),
);

scopesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const body = scopeBodySchema.parse(req.body);
    const dealerIds = [...new Set(body.dealerIds)];
    const locationIds = [...new Set(body.locationIds)];
    const brandIds = [...new Set(body.brandIds)];
    const name = await resolveScopeName(body.name, dealerIds, locationIds, brandIds);

    const updated = await prisma.scope.update({
      where: { id },
      data: {
        name,
        dealers: { set: dealerIds.map((item) => ({ id: item })) },
        locations: { set: locationIds.map((item) => ({ id: item })) },
        brands: { set: brandIds.map((item) => ({ id: item })) },
      },
      include: scopeInclude,
    });
    res.json(updated);
  }),
);

scopesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await prisma.scope.delete({ where: { id } });
    res.status(204).end();
  }),
);

