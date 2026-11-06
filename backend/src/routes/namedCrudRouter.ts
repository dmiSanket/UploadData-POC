import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { idParamSchema, nameSchema } from "../lib/schemas";

export interface NamedRepository<T> {
  list(query: Record<string, unknown>): Promise<T[]>;
  create(name: string): Promise<T>;
  update(id: number, name: string): Promise<T>;
  remove(id: number): Promise<unknown>;
}

/** Builds list/create/update/delete routes for simple `{ id, name }` entities. */
export function createNamedCrudRouter<T>(repo: NamedRepository<T>): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.json(await repo.list(req.query));
    }),
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const { name } = nameSchema.parse(req.body);
      res.status(201).json(await repo.create(name));
    }),
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const { id } = idParamSchema.parse(req.params);
      const { name } = nameSchema.parse(req.body);
      res.json(await repo.update(id, name));
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const { id } = idParamSchema.parse(req.params);
      await repo.remove(id);
      res.status(204).end();
    }),
  );

  return router;
}
