import { prisma } from "../lib/prisma";
import { createNamedCrudRouter } from "./namedCrudRouter";

export const categoriesRouter = createNamedCrudRouter({
  list: () => prisma.category.findMany({ orderBy: { name: "asc" } }),
  create: (name) => prisma.category.create({ data: { name } }),
  update: (id, name) => prisma.category.update({ where: { id }, data: { name } }),
  remove: (id) => prisma.category.delete({ where: { id } }),
});

export const dealersRouter = createNamedCrudRouter({
  list: () => prisma.dealer.findMany({ orderBy: { name: "asc" } }),
  create: (name) => prisma.dealer.create({ data: { name } }),
  update: (id, name) => prisma.dealer.update({ where: { id }, data: { name } }),
  remove: (id) => prisma.dealer.delete({ where: { id } }),
});

export const locationsRouter = createNamedCrudRouter({
  list: () => prisma.location.findMany({ orderBy: { name: "asc" } }),
  create: (name) => prisma.location.create({ data: { name } }),
  update: (id, name) => prisma.location.update({ where: { id }, data: { name } }),
  remove: (id) => prisma.location.delete({ where: { id } }),
});

export const brandsRouter = createNamedCrudRouter({
  list: () => prisma.brand.findMany({ orderBy: { name: "asc" } }),
  create: (name) => prisma.brand.create({ data: { name } }),
  update: (id, name) => prisma.brand.update({ where: { id }, data: { name } }),
  remove: (id) => prisma.brand.delete({ where: { id } }),
});
