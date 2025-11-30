-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "dispensed_at" TIMESTAMP(3),
ADD COLUMN     "dispensed_by" INTEGER,
ADD COLUMN     "invoice_id" INTEGER;

-- CreateIndex
CREATE INDEX "prescriptions_dispensed_by_idx" ON "prescriptions"("dispensed_by");

-- CreateIndex
CREATE INDEX "prescriptions_invoice_id_idx" ON "prescriptions"("invoice_id");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_dispensed_by_fkey" FOREIGN KEY ("dispensed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
