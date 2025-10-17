-- AlterTable
ALTER TABLE "lab_results" ADD COLUMN     "released_at" TIMESTAMP(3),
ADD COLUMN     "released_by" INTEGER,
ADD COLUMN     "released_to_patient" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "lab_results_released_by_idx" ON "lab_results"("released_by");

-- CreateIndex
CREATE INDEX "lab_results_released_to_patient_idx" ON "lab_results"("released_to_patient");

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
