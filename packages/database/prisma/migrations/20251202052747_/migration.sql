-- AlterTable
ALTER TABLE "prescription_items" ADD COLUMN     "hmo_contribution" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "packages_needed" INTEGER,
ADD COLUMN     "patient_pays" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "unit_price" DECIMAL(10,2);
