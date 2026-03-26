-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

-- CreateIndex
CREATE INDEX "Category_locale_idx" ON "Category"("locale");
