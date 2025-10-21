-- AlterTable
ALTER TABLE "lab_orders" ADD COLUMN     "assigned_to" INTEGER;

-- CreateIndex
CREATE INDEX "lab_orders_assigned_to_idx" ON "lab_orders"("assigned_to");

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
