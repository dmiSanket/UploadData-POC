-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('String', 'Number', 'Date', 'Boolean');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileSchema" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "scopeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColumnDefinition" (
    "id" SERIAL NOT NULL,
    "fileSchemaId" INTEGER NOT NULL,
    "columnName" TEXT NOT NULL,
    "dataType" "DataType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "validationRules" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ColumnDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestedBatch" (
    "id" SERIAL NOT NULL,
    "fileSchemaId" INTEGER NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngestedBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestedData" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rowData" JSONB NOT NULL,

    CONSTRAINT "IngestedData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Scope_name_key" ON "Scope"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FileSchema_categoryId_scopeId_key" ON "FileSchema"("categoryId", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "ColumnDefinition_fileSchemaId_columnName_key" ON "ColumnDefinition"("fileSchemaId", "columnName");

-- CreateIndex
CREATE INDEX "IngestedData_batchId_idx" ON "IngestedData"("batchId");

-- AddForeignKey
ALTER TABLE "FileSchema" ADD CONSTRAINT "FileSchema_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileSchema" ADD CONSTRAINT "FileSchema_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnDefinition" ADD CONSTRAINT "ColumnDefinition_fileSchemaId_fkey" FOREIGN KEY ("fileSchemaId") REFERENCES "FileSchema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestedBatch" ADD CONSTRAINT "IngestedBatch_fileSchemaId_fkey" FOREIGN KEY ("fileSchemaId") REFERENCES "FileSchema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestedData" ADD CONSTRAINT "IngestedData_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IngestedBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
