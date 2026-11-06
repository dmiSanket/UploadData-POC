-- DropForeignKey
ALTER TABLE "FileSchema" DROP CONSTRAINT "FileSchema_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "FileSchema" DROP CONSTRAINT "FileSchema_scopeId_fkey";

-- DropForeignKey
ALTER TABLE "IngestedBatch" DROP CONSTRAINT "IngestedBatch_fileSchemaId_fkey";

-- AddForeignKey
ALTER TABLE "FileSchema" ADD CONSTRAINT "FileSchema_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileSchema" ADD CONSTRAINT "FileSchema_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestedBatch" ADD CONSTRAINT "IngestedBatch_fileSchemaId_fkey" FOREIGN KEY ("fileSchemaId") REFERENCES "FileSchema"("id") ON DELETE CASCADE ON UPDATE CASCADE;
