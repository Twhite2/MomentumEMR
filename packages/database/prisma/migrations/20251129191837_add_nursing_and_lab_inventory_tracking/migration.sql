-- CreateTable
CREATE TABLE "nursing_inventory_usage" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "inventory_id" INTEGER NOT NULL,
    "nurse_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purpose" TEXT,
    "notes" TEXT,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nursing_inventory_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_inventory_usage" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "lab_order_id" INTEGER,
    "inventory_id" INTEGER NOT NULL,
    "lab_tech_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "test_type" TEXT,
    "notes" TEXT,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_inventory_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nursing_inventory_usage_hospital_id_idx" ON "nursing_inventory_usage"("hospital_id");

-- CreateIndex
CREATE INDEX "nursing_inventory_usage_patient_id_idx" ON "nursing_inventory_usage"("patient_id");

-- CreateIndex
CREATE INDEX "nursing_inventory_usage_inventory_id_idx" ON "nursing_inventory_usage"("inventory_id");

-- CreateIndex
CREATE INDEX "nursing_inventory_usage_nurse_id_idx" ON "nursing_inventory_usage"("nurse_id");

-- CreateIndex
CREATE INDEX "nursing_inventory_usage_used_at_idx" ON "nursing_inventory_usage"("used_at");

-- CreateIndex
CREATE INDEX "lab_inventory_usage_hospital_id_idx" ON "lab_inventory_usage"("hospital_id");

-- CreateIndex
CREATE INDEX "lab_inventory_usage_patient_id_idx" ON "lab_inventory_usage"("patient_id");

-- CreateIndex
CREATE INDEX "lab_inventory_usage_lab_order_id_idx" ON "lab_inventory_usage"("lab_order_id");

-- CreateIndex
CREATE INDEX "lab_inventory_usage_inventory_id_idx" ON "lab_inventory_usage"("inventory_id");

-- CreateIndex
CREATE INDEX "lab_inventory_usage_lab_tech_id_idx" ON "lab_inventory_usage"("lab_tech_id");

-- CreateIndex
CREATE INDEX "lab_inventory_usage_used_at_idx" ON "lab_inventory_usage"("used_at");

-- AddForeignKey
ALTER TABLE "nursing_inventory_usage" ADD CONSTRAINT "nursing_inventory_usage_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_inventory_usage" ADD CONSTRAINT "nursing_inventory_usage_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_inventory_usage" ADD CONSTRAINT "nursing_inventory_usage_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_inventory_usage" ADD CONSTRAINT "nursing_inventory_usage_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_inventory_usage" ADD CONSTRAINT "lab_inventory_usage_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_inventory_usage" ADD CONSTRAINT "lab_inventory_usage_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_inventory_usage" ADD CONSTRAINT "lab_inventory_usage_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_inventory_usage" ADD CONSTRAINT "lab_inventory_usage_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_inventory_usage" ADD CONSTRAINT "lab_inventory_usage_lab_tech_id_fkey" FOREIGN KEY ("lab_tech_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
