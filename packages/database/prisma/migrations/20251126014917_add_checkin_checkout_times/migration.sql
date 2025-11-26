-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "checked_in_at" TIMESTAMP(3),
ADD COLUMN     "checked_out_at" TIMESTAMP(3),
ADD COLUMN     "is_emergency" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "category" TEXT,
ADD COLUMN     "corporate_price" DECIMAL(10,2),
ADD COLUMN     "dosage_form" TEXT,
ADD COLUMN     "dosage_strength" TEXT,
ADD COLUMN     "drug_category" TEXT,
ADD COLUMN     "hmo_price" DECIMAL(10,2),
ADD COLUMN     "packaging_unit" TEXT DEFAULT 'tablet',
ADD COLUMN     "tablets_per_package" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "prescription_items" ADD COLUMN     "drug_category" TEXT,
ADD COLUMN     "duration_unit" TEXT DEFAULT 'days',
ADD COLUMN     "inventory_id" INTEGER,
ADD COLUMN     "is_custom_drug" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "total_tablets" INTEGER;

-- CreateIndex
CREATE INDEX "inventory_category_idx" ON "inventory"("category");

-- CreateIndex
CREATE INDEX "inventory_drug_category_idx" ON "inventory"("drug_category");

-- CreateIndex
CREATE INDEX "prescription_items_inventory_id_idx" ON "prescription_items"("inventory_id");

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
