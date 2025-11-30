-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "doctor_completed_at" TIMESTAMP(3),
ADD COLUMN     "doctor_started_at" TIMESTAMP(3),
ADD COLUMN     "lab_completed_at" TIMESTAMP(3),
ADD COLUMN     "lab_started_at" TIMESTAMP(3),
ADD COLUMN     "pharmacy_completed_at" TIMESTAMP(3),
ADD COLUMN     "pharmacy_started_at" TIMESTAMP(3),
ADD COLUMN     "vitals_completed_at" TIMESTAMP(3);
