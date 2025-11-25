-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN     "treatment_plan" TEXT;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "hmo_enrollee_number" TEXT,
ADD COLUMN     "tribe" TEXT;
