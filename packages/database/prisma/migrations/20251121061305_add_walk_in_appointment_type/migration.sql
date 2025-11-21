/*
  Warnings:

  - A unique constraint covering the columns `[hospital_id,name]` on the table `hmo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hospital_id,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `hmo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('draft', 'ready_for_claims', 'batching', 'submitted', 'processing', 'paid', 'partially_paid', 'queried', 'denied', 'resubmitted');

-- CreateEnum
CREATE TYPE "ClaimSubmissionMethod" AS ENUM ('email_pdf', 'portal_excel', 'portal_csv', 'api');

-- CreateEnum
CREATE TYPE "HMOCodingStandard" AS ENUM ('icd10', 'cpt', 'local');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('admitted', 'in_treatment', 'discharged', 'transferred');

-- CreateEnum
CREATE TYPE "ChatRoomType" AS ENUM ('general', 'private');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read');

-- AlterEnum
ALTER TYPE "AppointmentType" ADD VALUE 'walk_in';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'receptionist';

-- DropIndex
DROP INDEX "public"."users_email_key";

-- AlterTable
ALTER TABLE "hmo" ADD COLUMN     "coding_standard" "HMOCodingStandard" NOT NULL DEFAULT 'icd10',
ADD COLUMN     "copayment_rules" JSONB,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "provider_code" TEXT,
ADD COLUMN     "required_format" TEXT,
ADD COLUMN     "requires_authorization" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "submission_email" TEXT,
ADD COLUMN     "submission_method" "ClaimSubmissionMethod" NOT NULL DEFAULT 'email_pdf',
ADD COLUMN     "submission_portal_url" TEXT,
ALTER COLUMN "policy_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN     "allergies" JSONB;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "allergies" JSONB,
ADD COLUMN     "blood_group" TEXT;

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "drug_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "lab_result_attachments" (
    "id" SERIAL NOT NULL,
    "lab_result_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_data" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_result_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vitals" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "recorded_by" INTEGER NOT NULL,
    "appointment_id" INTEGER,
    "temperature" DECIMAL(4,1),
    "blood_pressure_sys" INTEGER,
    "blood_pressure_dia" INTEGER,
    "heart_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "oxygen_saturation" DECIMAL(5,2),
    "weight" DECIMAL(5,2),
    "height" DECIMAL(5,2),
    "bmi" DECIMAL(4,2),
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "admitted_by" INTEGER NOT NULL,
    "discharged_by" INTEGER,
    "ward" TEXT,
    "bed_number" TEXT,
    "admission_reason" TEXT NOT NULL,
    "admission_date" TIMESTAMP(3) NOT NULL,
    "discharge_date" TIMESTAMP(3),
    "status" "AdmissionStatus" NOT NULL DEFAULT 'admitted',
    "discharge_summary" TEXT,
    "follow_up_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nursing_notes" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "nurse_id" INTEGER NOT NULL,
    "appointment_id" INTEGER,
    "note_type" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nursing_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "room_type" "ChatRoomType" NOT NULL,
    "name" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "last_read" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unread_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "encrypted_content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "mentioned_user_ids" INTEGER[],
    "reply_to_message_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_attachments" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "message_id" INTEGER,
    "uploaded_by" INTEGER NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "encrypted_data" TEXT NOT NULL,
    "encryption_key" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_read_receipts" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_audit_logs" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hmo_plans" (
    "id" SERIAL NOT NULL,
    "hmo_id" INTEGER NOT NULL,
    "plan_name" TEXT NOT NULL,
    "plan_code" TEXT,
    "coverage_limit" DECIMAL(15,2),
    "copay_percentage" DECIMAL(5,2),
    "covered_services" JSONB,
    "excluded_services" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hmo_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hmo_field_mappings" (
    "id" SERIAL NOT NULL,
    "hmo_id" INTEGER NOT NULL,
    "emr_field" TEXT NOT NULL,
    "hmo_field" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "default_value" TEXT,
    "transformation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hmo_field_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounters" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "hmo_id" INTEGER,
    "doctor_id" INTEGER NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "encounter_type" TEXT NOT NULL,
    "admission_date" TIMESTAMP(3),
    "discharge_date" TIMESTAMP(3),
    "authorization_code" TEXT,
    "chief_complaint" TEXT,
    "notes" TEXT,
    "claim_status" "ClaimStatus" NOT NULL DEFAULT 'draft',
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hmo_covered_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "patient_copay_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "patient_paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paystack_auth_code" TEXT,
    "claim_batch_id" INTEGER,
    "ready_for_claims_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_diagnoses" (
    "id" SERIAL NOT NULL,
    "encounter_id" INTEGER NOT NULL,
    "diagnosis_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounter_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_procedures" (
    "id" SERIAL NOT NULL,
    "encounter_id" INTEGER NOT NULL,
    "procedure_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL,
    "performed_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounter_procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_billing_items" (
    "id" SERIAL NOT NULL,
    "encounter_id" INTEGER NOT NULL,
    "service_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "is_covered_by_hmo" BOOLEAN NOT NULL DEFAULT true,
    "hmo_coverage" DECIMAL(5,2),
    "hmo_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "patient_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounter_billing_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_attachments" (
    "id" SERIAL NOT NULL,
    "encounter_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "description" TEXT,
    "uploaded_by_id" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounter_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_batches" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "hmo_id" INTEGER NOT NULL,
    "batch_number" TEXT NOT NULL,
    "batch_date" TIMESTAMP(3) NOT NULL,
    "encounter_count" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'batching',
    "generated_file_url" TEXT,
    "submission_notes" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_submissions" (
    "id" SERIAL NOT NULL,
    "claim_batch_id" INTEGER NOT NULL,
    "hmo_id" INTEGER NOT NULL,
    "submission_date" TIMESTAMP(3) NOT NULL,
    "submission_method" "ClaimSubmissionMethod" NOT NULL,
    "submitted_amount" DECIMAL(15,2) NOT NULL,
    "approved_amount" DECIMAL(15,2),
    "paid_amount" DECIMAL(15,2),
    "status" "ClaimStatus" NOT NULL DEFAULT 'submitted',
    "response_date" TIMESTAMP(3),
    "payment_date" TIMESTAMP(3),
    "query_reason" TEXT,
    "query_response" TEXT,
    "denial_reason" TEXT,
    "submission_reference" TEXT,
    "notes" TEXT,
    "submitted_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hmo_tariffs" (
    "id" SERIAL NOT NULL,
    "hmo_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "base_price" DECIMAL(15,2) NOT NULL,
    "tier_0_price" DECIMAL(15,2),
    "tier_1_price" DECIMAL(15,2),
    "tier_2_price" DECIMAL(15,2),
    "tier_3_price" DECIMAL(15,2),
    "tier_4_price" DECIMAL(15,2),
    "is_pa_required" BOOLEAN NOT NULL DEFAULT false,
    "effective_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hmo_tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_result_attachments_lab_result_id_idx" ON "lab_result_attachments"("lab_result_id");

-- CreateIndex
CREATE INDEX "vitals_hospital_id_idx" ON "vitals"("hospital_id");

-- CreateIndex
CREATE INDEX "vitals_patient_id_idx" ON "vitals"("patient_id");

-- CreateIndex
CREATE INDEX "vitals_recorded_by_idx" ON "vitals"("recorded_by");

-- CreateIndex
CREATE INDEX "vitals_appointment_id_idx" ON "vitals"("appointment_id");

-- CreateIndex
CREATE INDEX "vitals_recorded_at_idx" ON "vitals"("recorded_at");

-- CreateIndex
CREATE INDEX "admissions_hospital_id_idx" ON "admissions"("hospital_id");

-- CreateIndex
CREATE INDEX "admissions_patient_id_idx" ON "admissions"("patient_id");

-- CreateIndex
CREATE INDEX "admissions_admitted_by_idx" ON "admissions"("admitted_by");

-- CreateIndex
CREATE INDEX "admissions_status_idx" ON "admissions"("status");

-- CreateIndex
CREATE INDEX "admissions_admission_date_idx" ON "admissions"("admission_date");

-- CreateIndex
CREATE INDEX "nursing_notes_hospital_id_idx" ON "nursing_notes"("hospital_id");

-- CreateIndex
CREATE INDEX "nursing_notes_patient_id_idx" ON "nursing_notes"("patient_id");

-- CreateIndex
CREATE INDEX "nursing_notes_nurse_id_idx" ON "nursing_notes"("nurse_id");

-- CreateIndex
CREATE INDEX "nursing_notes_appointment_id_idx" ON "nursing_notes"("appointment_id");

-- CreateIndex
CREATE INDEX "nursing_notes_created_at_idx" ON "nursing_notes"("created_at");

-- CreateIndex
CREATE INDEX "chat_rooms_hospital_id_idx" ON "chat_rooms"("hospital_id");

-- CreateIndex
CREATE INDEX "chat_rooms_room_type_idx" ON "chat_rooms"("room_type");

-- CreateIndex
CREATE INDEX "chat_rooms_created_by_idx" ON "chat_rooms"("created_by");

-- CreateIndex
CREATE INDEX "chat_participants_room_id_idx" ON "chat_participants"("room_id");

-- CreateIndex
CREATE INDEX "chat_participants_user_id_idx" ON "chat_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participants_room_id_user_id_key" ON "chat_participants"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_messages_room_id_idx" ON "chat_messages"("room_id");

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");

-- CreateIndex
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");

-- CreateIndex
CREATE INDEX "chat_messages_deleted_at_idx" ON "chat_messages"("deleted_at");

-- CreateIndex
CREATE INDEX "chat_attachments_room_id_idx" ON "chat_attachments"("room_id");

-- CreateIndex
CREATE INDEX "chat_attachments_message_id_idx" ON "chat_attachments"("message_id");

-- CreateIndex
CREATE INDEX "chat_attachments_uploaded_by_idx" ON "chat_attachments"("uploaded_by");

-- CreateIndex
CREATE INDEX "chat_read_receipts_message_id_idx" ON "chat_read_receipts"("message_id");

-- CreateIndex
CREATE INDEX "chat_read_receipts_user_id_idx" ON "chat_read_receipts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_read_receipts_message_id_user_id_key" ON "chat_read_receipts"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_audit_logs_hospital_id_idx" ON "chat_audit_logs"("hospital_id");

-- CreateIndex
CREATE INDEX "chat_audit_logs_user_id_idx" ON "chat_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "chat_audit_logs_action_idx" ON "chat_audit_logs"("action");

-- CreateIndex
CREATE INDEX "chat_audit_logs_created_at_idx" ON "chat_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "hmo_plans_hmo_id_idx" ON "hmo_plans"("hmo_id");

-- CreateIndex
CREATE INDEX "hmo_field_mappings_hmo_id_idx" ON "hmo_field_mappings"("hmo_id");

-- CreateIndex
CREATE INDEX "hmo_field_mappings_emr_field_idx" ON "hmo_field_mappings"("emr_field");

-- CreateIndex
CREATE INDEX "encounters_hospital_id_idx" ON "encounters"("hospital_id");

-- CreateIndex
CREATE INDEX "encounters_patient_id_idx" ON "encounters"("patient_id");

-- CreateIndex
CREATE INDEX "encounters_hmo_id_idx" ON "encounters"("hmo_id");

-- CreateIndex
CREATE INDEX "encounters_doctor_id_idx" ON "encounters"("doctor_id");

-- CreateIndex
CREATE INDEX "encounters_claim_status_idx" ON "encounters"("claim_status");

-- CreateIndex
CREATE INDEX "encounters_visit_date_idx" ON "encounters"("visit_date");

-- CreateIndex
CREATE INDEX "encounters_claim_batch_id_idx" ON "encounters"("claim_batch_id");

-- CreateIndex
CREATE INDEX "encounter_diagnoses_encounter_id_idx" ON "encounter_diagnoses"("encounter_id");

-- CreateIndex
CREATE INDEX "encounter_procedures_encounter_id_idx" ON "encounter_procedures"("encounter_id");

-- CreateIndex
CREATE INDEX "encounter_billing_items_encounter_id_idx" ON "encounter_billing_items"("encounter_id");

-- CreateIndex
CREATE INDEX "encounter_attachments_encounter_id_idx" ON "encounter_attachments"("encounter_id");

-- CreateIndex
CREATE UNIQUE INDEX "claim_batches_batch_number_key" ON "claim_batches"("batch_number");

-- CreateIndex
CREATE INDEX "claim_batches_hospital_id_idx" ON "claim_batches"("hospital_id");

-- CreateIndex
CREATE INDEX "claim_batches_hmo_id_idx" ON "claim_batches"("hmo_id");

-- CreateIndex
CREATE INDEX "claim_batches_status_idx" ON "claim_batches"("status");

-- CreateIndex
CREATE INDEX "claim_batches_batch_date_idx" ON "claim_batches"("batch_date");

-- CreateIndex
CREATE INDEX "claim_submissions_claim_batch_id_idx" ON "claim_submissions"("claim_batch_id");

-- CreateIndex
CREATE INDEX "claim_submissions_hmo_id_idx" ON "claim_submissions"("hmo_id");

-- CreateIndex
CREATE INDEX "claim_submissions_status_idx" ON "claim_submissions"("status");

-- CreateIndex
CREATE INDEX "claim_submissions_submission_date_idx" ON "claim_submissions"("submission_date");

-- CreateIndex
CREATE INDEX "hmo_tariffs_hmo_id_idx" ON "hmo_tariffs"("hmo_id");

-- CreateIndex
CREATE INDEX "hmo_tariffs_code_idx" ON "hmo_tariffs"("code");

-- CreateIndex
CREATE INDEX "hmo_tariffs_category_idx" ON "hmo_tariffs"("category");

-- CreateIndex
CREATE INDEX "hmo_tariffs_name_idx" ON "hmo_tariffs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hmo_tariffs_hmo_id_code_key" ON "hmo_tariffs"("hmo_id", "code");

-- CreateIndex
CREATE INDEX "hmo_name_idx" ON "hmo"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hmo_hospital_id_name_key" ON "hmo"("hospital_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_hospital_id_email_key" ON "users"("hospital_id", "email");

-- AddForeignKey
ALTER TABLE "lab_result_attachments" ADD CONSTRAINT "lab_result_attachments_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_admitted_by_fkey" FOREIGN KEY ("admitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_discharged_by_fkey" FOREIGN KEY ("discharged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nursing_notes" ADD CONSTRAINT "nursing_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_read_receipts" ADD CONSTRAINT "chat_read_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_read_receipts" ADD CONSTRAINT "chat_read_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_audit_logs" ADD CONSTRAINT "chat_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hmo_plans" ADD CONSTRAINT "hmo_plans_hmo_id_fkey" FOREIGN KEY ("hmo_id") REFERENCES "hmo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hmo_field_mappings" ADD CONSTRAINT "hmo_field_mappings_hmo_id_fkey" FOREIGN KEY ("hmo_id") REFERENCES "hmo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_hmo_id_fkey" FOREIGN KEY ("hmo_id") REFERENCES "hmo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_claim_batch_id_fkey" FOREIGN KEY ("claim_batch_id") REFERENCES "claim_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_diagnoses" ADD CONSTRAINT "encounter_diagnoses_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_procedures" ADD CONSTRAINT "encounter_procedures_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_procedures" ADD CONSTRAINT "encounter_procedures_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_billing_items" ADD CONSTRAINT "encounter_billing_items_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_attachments" ADD CONSTRAINT "encounter_attachments_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_attachments" ADD CONSTRAINT "encounter_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_batches" ADD CONSTRAINT "claim_batches_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_batches" ADD CONSTRAINT "claim_batches_hmo_id_fkey" FOREIGN KEY ("hmo_id") REFERENCES "hmo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_batches" ADD CONSTRAINT "claim_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_submissions" ADD CONSTRAINT "claim_submissions_claim_batch_id_fkey" FOREIGN KEY ("claim_batch_id") REFERENCES "claim_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_submissions" ADD CONSTRAINT "claim_submissions_hmo_id_fkey" FOREIGN KEY ("hmo_id") REFERENCES "hmo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_submissions" ADD CONSTRAINT "claim_submissions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hmo_tariffs" ADD CONSTRAINT "hmo_tariffs_hmo_id_fkey" FOREIGN KEY ("hmo_id") REFERENCES "hmo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
