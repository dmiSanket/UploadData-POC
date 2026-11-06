import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = ["PO Order", "OOQ", "SOQ", "MRN", "STN"];
const DEALERS = [
  "Apex Motors",
  "Metro Auto Group",
  "Summit Dealership",
  "Prime Auto Hub",
  "Horizon Motors",
];
const LOCATIONS = [
  "Mumbai - West",
  "Delhi NCR",
  "Bengaluru South",
  "Chennai Central",
  "Pune Warehouse",
];
const BRANDS = ["Toyota", "Hyundai", "Tata Motors", "Mahindra", "Kia"];

async function main(): Promise<void> {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of DEALERS) {
    await prisma.dealer.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of LOCATIONS) {
    await prisma.location.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of BRANDS) {
    await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
  }

  const [apex, metro, summit] = await Promise.all([
    prisma.dealer.findUniqueOrThrow({ where: { name: "Apex Motors" } }),
    prisma.dealer.findUniqueOrThrow({ where: { name: "Metro Auto Group" } }),
    prisma.dealer.findUniqueOrThrow({ where: { name: "Summit Dealership" } }),
  ]);
  const [mumbai, delhi, bengaluru] = await Promise.all([
    prisma.location.findUniqueOrThrow({ where: { name: "Mumbai - West" } }),
    prisma.location.findUniqueOrThrow({ where: { name: "Delhi NCR" } }),
    prisma.location.findUniqueOrThrow({ where: { name: "Bengaluru South" } }),
  ]);
  const [toyota, hyundai, tata] = await Promise.all([
    prisma.brand.findUniqueOrThrow({ where: { name: "Toyota" } }),
    prisma.brand.findUniqueOrThrow({ where: { name: "Hyundai" } }),
    prisma.brand.findUniqueOrThrow({ where: { name: "Tata Motors" } }),
  ]);

  // 1) Multi-dealer + Multi-location + Multi-brand combined scope
  const westMetroScope = await prisma.scope.upsert({
    where: { name: "Apex Motors, Metro Auto Group · Mumbai - West, Delhi NCR · Toyota, Hyundai" },
    update: {
      dealers: { set: [{ id: apex.id }, { id: metro.id }] },
      locations: { set: [{ id: mumbai.id }, { id: delhi.id }] },
      brands: { set: [{ id: toyota.id }, { id: hyundai.id }] },
    },
    create: {
      name: "Apex Motors, Metro Auto Group · Mumbai - West, Delhi NCR · Toyota, Hyundai",
      dealers: { connect: [{ id: apex.id }, { id: metro.id }] },
      locations: { connect: [{ id: mumbai.id }, { id: delhi.id }] },
      brands: { connect: [{ id: toyota.id }, { id: hyundai.id }] },
    },
  });

  // 2) Specific single dealer + location + brand scope
  const southTataScope = await prisma.scope.upsert({
    where: { name: "Summit Dealership · Bengaluru South · Tata Motors" },
    update: {
      dealers: { set: [{ id: summit.id }] },
      locations: { set: [{ id: bengaluru.id }] },
      brands: { set: [{ id: tata.id }] },
    },
    create: {
      name: "Summit Dealership · Bengaluru South · Tata Motors",
      dealers: { connect: [{ id: summit.id }] },
      locations: { connect: [{ id: bengaluru.id }] },
      brands: { connect: [{ id: tata.id }] },
    },
  });

  const poOrder = await prisma.category.findUniqueOrThrow({ where: { name: "PO Order" } });
  const soq = await prisma.category.findUniqueOrThrow({ where: { name: "SOQ" } });

  const schema1 = await prisma.fileSchema.upsert({
    where: { categoryId_scopeId: { categoryId: poOrder.id, scopeId: westMetroScope.id } },
    update: {},
    create: { categoryId: poOrder.id, scopeId: westMetroScope.id },
  });

  const columns1 = [
    { columnName: "part_number", dataType: "String", isRequired: true, validationRules: { regex: "^[A-Za-z0-9-]+$", maxLength: 30 } },
    { columnName: "dealer_code", dataType: "String", isRequired: true, validationRules: null },
    { columnName: "location_code", dataType: "String", isRequired: true, validationRules: null },
    { columnName: "brand_name", dataType: "String", isRequired: false, validationRules: null },
    { columnName: "quantity", dataType: "Number", isRequired: true, validationRules: { min: 1, max: 100000 } },
    { columnName: "order_date", dataType: "Date", isRequired: false, validationRules: null },
    { columnName: "is_urgent", dataType: "Boolean", isRequired: false, validationRules: null },
  ] as const;

  for (const [position, column] of columns1.entries()) {
    await prisma.columnDefinition.upsert({
      where: { fileSchemaId_columnName: { fileSchemaId: schema1.id, columnName: column.columnName } },
      update: {},
      create: {
        fileSchemaId: schema1.id,
        position,
        columnName: column.columnName,
        dataType: column.dataType,
        isRequired: column.isRequired,
        ...(column.validationRules ? { validationRules: column.validationRules } : {}),
      },
    });
  }

  const schema2 = await prisma.fileSchema.upsert({
    where: { categoryId_scopeId: { categoryId: soq.id, scopeId: southTataScope.id } },
    update: {},
    create: { categoryId: soq.id, scopeId: southTataScope.id },
  });

  const columns2 = [
    { columnName: "sku_code", dataType: "String", isRequired: true, validationRules: { minLength: 3, maxLength: 24 } },
    { columnName: "suggested_qty", dataType: "Number", isRequired: true, validationRules: { min: 1 } },
    { columnName: "stock_on_hand", dataType: "Number", isRequired: false, validationRules: { min: 0 } },
  ] as const;

  for (const [position, column] of columns2.entries()) {
    await prisma.columnDefinition.upsert({
      where: { fileSchemaId_columnName: { fileSchemaId: schema2.id, columnName: column.columnName } },
      update: {},
      create: {
        fileSchemaId: schema2.id,
        position,
        columnName: column.columnName,
        dataType: column.dataType,
        isRequired: column.isRequired,
        ...(column.validationRules ? { validationRules: column.validationRules } : {}),
      },
    });
  }

  console.log("Seeded Categories, Dealers, Locations, Brands, multi-target Scopes, and sample FileSchemas.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
