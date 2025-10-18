-- Add primary_doctor_id column to patients table
ALTER TABLE "patients" ADD COLUMN "primary_doctor_id" INTEGER;

-- Add index for primary_doctor_id
CREATE INDEX "patients_primary_doctor_id_idx" ON "patients"("primary_doctor_id");

-- Add foreign key constraint
ALTER TABLE "patients" ADD CONSTRAINT "patients_primary_doctor_id_fkey" 
  FOREIGN KEY ("primary_doctor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
