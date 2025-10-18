--
-- PostgreSQL database dump
--

\restrict OtearZyi6Pxh1zJsGCcKZtaLBBGburcq5ED8EjEVWDhyi9ann4vyvz7KhdiIUXC

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_doctor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.prescription_items DROP CONSTRAINT IF EXISTS prescription_items_prescription_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_primary_doctor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_insurance_id_fkey;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_corporate_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.patient_surveys DROP CONSTRAINT IF EXISTS patient_surveys_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.patient_surveys DROP CONSTRAINT IF EXISTS patient_surveys_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.medical_records DROP CONSTRAINT IF EXISTS medical_records_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.medical_records DROP CONSTRAINT IF EXISTS medical_records_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.medical_records DROP CONSTRAINT IF EXISTS medical_records_doctor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.lab_results DROP CONSTRAINT IF EXISTS lab_results_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.lab_results DROP CONSTRAINT IF EXISTS lab_results_released_by_fkey;
ALTER TABLE IF EXISTS ONLY public.lab_results DROP CONSTRAINT IF EXISTS lab_results_lab_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.lab_result_values DROP CONSTRAINT IF EXISTS lab_result_values_lab_result_id_fkey;
ALTER TABLE IF EXISTS ONLY public.lab_orders DROP CONSTRAINT IF EXISTS lab_orders_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.lab_orders DROP CONSTRAINT IF EXISTS lab_orders_ordered_by_fkey;
ALTER TABLE IF EXISTS ONLY public.lab_orders DROP CONSTRAINT IF EXISTS lab_orders_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory DROP CONSTRAINT IF EXISTS inventory_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hmo DROP CONSTRAINT IF EXISTS hmo_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.corporate_clients DROP CONSTRAINT IF EXISTS corporate_clients_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analytics_reports DROP CONSTRAINT IF EXISTS analytics_reports_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analytics_reports DROP CONSTRAINT IF EXISTS analytics_reports_generated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.analytics_metrics DROP CONSTRAINT IF EXISTS analytics_metrics_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analytics_dashboards DROP CONSTRAINT IF EXISTS analytics_dashboards_hospital_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analytics_dashboards DROP CONSTRAINT IF EXISTS analytics_dashboards_created_by_fkey;
DROP INDEX IF EXISTS public.users_password_reset_token_idx;
DROP INDEX IF EXISTS public.users_hospital_id_idx;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.prescriptions_patient_id_idx;
DROP INDEX IF EXISTS public.prescriptions_hospital_id_idx;
DROP INDEX IF EXISTS public.prescriptions_doctor_id_idx;
DROP INDEX IF EXISTS public.prescription_items_prescription_id_idx;
DROP INDEX IF EXISTS public.payments_transaction_ref_key;
DROP INDEX IF EXISTS public.payments_invoice_id_idx;
DROP INDEX IF EXISTS public.patients_user_id_key;
DROP INDEX IF EXISTS public.patients_user_id_idx;
DROP INDEX IF EXISTS public.patients_primary_doctor_id_idx;
DROP INDEX IF EXISTS public.patients_insurance_id_idx;
DROP INDEX IF EXISTS public.patients_hospital_id_idx;
DROP INDEX IF EXISTS public.patients_corporate_client_id_idx;
DROP INDEX IF EXISTS public.patient_surveys_patient_id_idx;
DROP INDEX IF EXISTS public.patient_surveys_hospital_id_idx;
DROP INDEX IF EXISTS public.notifications_user_id_idx;
DROP INDEX IF EXISTS public.notifications_status_idx;
DROP INDEX IF EXISTS public.notifications_hospital_id_idx;
DROP INDEX IF EXISTS public.medical_records_patient_id_idx;
DROP INDEX IF EXISTS public.medical_records_hospital_id_idx;
DROP INDEX IF EXISTS public.medical_records_doctor_id_idx;
DROP INDEX IF EXISTS public.lab_results_uploaded_by_idx;
DROP INDEX IF EXISTS public.lab_results_released_to_patient_idx;
DROP INDEX IF EXISTS public.lab_results_released_by_idx;
DROP INDEX IF EXISTS public.lab_results_lab_order_id_idx;
DROP INDEX IF EXISTS public.lab_result_values_lab_result_id_idx;
DROP INDEX IF EXISTS public.lab_orders_status_idx;
DROP INDEX IF EXISTS public.lab_orders_patient_id_idx;
DROP INDEX IF EXISTS public.lab_orders_ordered_by_idx;
DROP INDEX IF EXISTS public.lab_orders_hospital_id_idx;
DROP INDEX IF EXISTS public.invoices_status_idx;
DROP INDEX IF EXISTS public.invoices_patient_id_idx;
DROP INDEX IF EXISTS public.invoices_hospital_id_idx;
DROP INDEX IF EXISTS public.invoice_items_invoice_id_idx;
DROP INDEX IF EXISTS public.inventory_stock_quantity_idx;
DROP INDEX IF EXISTS public.inventory_item_code_key;
DROP INDEX IF EXISTS public.inventory_hospital_id_idx;
DROP INDEX IF EXISTS public.hmo_hospital_id_idx;
DROP INDEX IF EXISTS public.corporate_clients_hospital_id_idx;
DROP INDEX IF EXISTS public.appointments_start_time_idx;
DROP INDEX IF EXISTS public.appointments_patient_id_idx;
DROP INDEX IF EXISTS public.appointments_hospital_id_idx;
DROP INDEX IF EXISTS public.appointments_doctor_id_idx;
DROP INDEX IF EXISTS public.analytics_reports_status_idx;
DROP INDEX IF EXISTS public.analytics_reports_hospital_id_idx;
DROP INDEX IF EXISTS public.analytics_metrics_metric_type_idx;
DROP INDEX IF EXISTS public.analytics_metrics_metric_date_idx;
DROP INDEX IF EXISTS public.analytics_metrics_hospital_id_idx;
DROP INDEX IF EXISTS public.analytics_dashboards_hospital_id_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.prescription_items DROP CONSTRAINT IF EXISTS prescription_items_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.patients DROP CONSTRAINT IF EXISTS patients_pkey;
ALTER TABLE IF EXISTS ONLY public.patient_surveys DROP CONSTRAINT IF EXISTS patient_surveys_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.medical_records DROP CONSTRAINT IF EXISTS medical_records_pkey;
ALTER TABLE IF EXISTS ONLY public.lab_results DROP CONSTRAINT IF EXISTS lab_results_pkey;
ALTER TABLE IF EXISTS ONLY public.lab_result_values DROP CONSTRAINT IF EXISTS lab_result_values_pkey;
ALTER TABLE IF EXISTS ONLY public.lab_orders DROP CONSTRAINT IF EXISTS lab_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory DROP CONSTRAINT IF EXISTS inventory_pkey;
ALTER TABLE IF EXISTS ONLY public.hospitals DROP CONSTRAINT IF EXISTS hospitals_pkey;
ALTER TABLE IF EXISTS ONLY public.hmo DROP CONSTRAINT IF EXISTS hmo_pkey;
ALTER TABLE IF EXISTS ONLY public.corporate_clients DROP CONSTRAINT IF EXISTS corporate_clients_pkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics_reports DROP CONSTRAINT IF EXISTS analytics_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics_metrics DROP CONSTRAINT IF EXISTS analytics_metrics_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics_dashboards DROP CONSTRAINT IF EXISTS analytics_dashboards_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.prescriptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.prescription_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.patients ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.patient_surveys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.medical_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lab_results ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lab_result_values ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lab_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.invoice_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hospitals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hmo ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.corporate_clients ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.appointments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.analytics_reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.analytics_metrics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.analytics_dashboards ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.prescriptions_id_seq;
DROP TABLE IF EXISTS public.prescriptions;
DROP SEQUENCE IF EXISTS public.prescription_items_id_seq;
DROP TABLE IF EXISTS public.prescription_items;
DROP SEQUENCE IF EXISTS public.payments_id_seq;
DROP TABLE IF EXISTS public.payments;
DROP SEQUENCE IF EXISTS public.patients_id_seq;
DROP TABLE IF EXISTS public.patients;
DROP SEQUENCE IF EXISTS public.patient_surveys_id_seq;
DROP TABLE IF EXISTS public.patient_surveys;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.medical_records_id_seq;
DROP TABLE IF EXISTS public.medical_records;
DROP SEQUENCE IF EXISTS public.lab_results_id_seq;
DROP TABLE IF EXISTS public.lab_results;
DROP SEQUENCE IF EXISTS public.lab_result_values_id_seq;
DROP TABLE IF EXISTS public.lab_result_values;
DROP SEQUENCE IF EXISTS public.lab_orders_id_seq;
DROP TABLE IF EXISTS public.lab_orders;
DROP SEQUENCE IF EXISTS public.invoices_id_seq;
DROP TABLE IF EXISTS public.invoices;
DROP SEQUENCE IF EXISTS public.invoice_items_id_seq;
DROP TABLE IF EXISTS public.invoice_items;
DROP SEQUENCE IF EXISTS public.inventory_id_seq;
DROP TABLE IF EXISTS public.inventory;
DROP SEQUENCE IF EXISTS public.hospitals_id_seq;
DROP TABLE IF EXISTS public.hospitals;
DROP SEQUENCE IF EXISTS public.hmo_id_seq;
DROP TABLE IF EXISTS public.hmo;
DROP SEQUENCE IF EXISTS public.corporate_clients_id_seq;
DROP TABLE IF EXISTS public.corporate_clients;
DROP SEQUENCE IF EXISTS public.appointments_id_seq;
DROP TABLE IF EXISTS public.appointments;
DROP SEQUENCE IF EXISTS public.analytics_reports_id_seq;
DROP TABLE IF EXISTS public.analytics_reports;
DROP SEQUENCE IF EXISTS public.analytics_metrics_id_seq;
DROP TABLE IF EXISTS public.analytics_metrics;
DROP SEQUENCE IF EXISTS public.analytics_dashboards_id_seq;
DROP TABLE IF EXISTS public.analytics_dashboards;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."ReportType";
DROP TYPE IF EXISTS public."ReportStatus";
DROP TYPE IF EXISTS public."PrescriptionStatus";
DROP TYPE IF EXISTS public."PatientType";
DROP TYPE IF EXISTS public."NotificationType";
DROP TYPE IF EXISTS public."NotificationStatus";
DROP TYPE IF EXISTS public."LabOrderType";
DROP TYPE IF EXISTS public."LabOrderStatus";
DROP TYPE IF EXISTS public."InvoiceStatus";
DROP TYPE IF EXISTS public."DeliveryMethod";
DROP TYPE IF EXISTS public."DashboardType";
DROP TYPE IF EXISTS public."AppointmentType";
DROP TYPE IF EXISTS public."AppointmentStatus";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'scheduled',
    'checked_in',
    'completed',
    'cancelled'
);


--
-- Name: AppointmentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AppointmentType" AS ENUM (
    'OPD',
    'IPD',
    'surgery',
    'lab',
    'follow_up'
);


--
-- Name: DashboardType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DashboardType" AS ENUM (
    'patient_volume',
    'revenue',
    'drug_statistics',
    'consultation_metrics',
    'operational'
);


--
-- Name: DeliveryMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DeliveryMethod" AS ENUM (
    'email',
    'sms',
    'push',
    'in_app'
);


--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'refunded'
);


--
-- Name: LabOrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LabOrderStatus" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: LabOrderType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LabOrderType" AS ENUM (
    'Lab_Test',
    'X_ray',
    'CT_Scan',
    'MRI',
    'Ultrasound',
    'Pathology'
);


--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'pending',
    'sent',
    'read',
    'failed'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'lab_order',
    'prescription_issued',
    'inventory_low',
    'appointment_reminder',
    'lab_result_ready',
    'payment_due'
);


--
-- Name: PatientType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PatientType" AS ENUM (
    'hmo',
    'corporate',
    'self_pay'
);


--
-- Name: PrescriptionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PrescriptionStatus" AS ENUM (
    'active',
    'completed'
);


--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'generating',
    'completed',
    'failed'
);


--
-- Name: ReportType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportType" AS ENUM (
    'daily_summary',
    'weekly_revenue',
    'monthly_patient_volume',
    'drug_usage',
    'consultation_times'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'super_admin',
    'admin',
    'doctor',
    'nurse',
    'pharmacist',
    'cashier',
    'patient',
    'lab_tech'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: analytics_dashboards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_dashboards (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    dashboard_name text NOT NULL,
    dashboard_type public."DashboardType",
    config jsonb,
    created_by integer,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: analytics_dashboards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytics_dashboards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_dashboards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytics_dashboards_id_seq OWNED BY public.analytics_dashboards.id;


--
-- Name: analytics_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_metrics (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    metric_date date NOT NULL,
    metric_type text NOT NULL,
    metric_value numeric(15,2),
    metric_unit text,
    patient_type public."PatientType",
    additional_data jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: analytics_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytics_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytics_metrics_id_seq OWNED BY public.analytics_metrics.id;


--
-- Name: analytics_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_reports (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    report_type public."ReportType",
    report_period_start date NOT NULL,
    report_period_end date NOT NULL,
    generated_by integer,
    report_data jsonb,
    file_url text,
    status public."ReportStatus",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: analytics_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytics_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytics_reports_id_seq OWNED BY public.analytics_reports.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    department text,
    appointment_type public."AppointmentType" NOT NULL,
    status public."AppointmentStatus" NOT NULL,
    start_time timestamp(3) without time zone NOT NULL,
    end_time timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: corporate_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.corporate_clients (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    company_name text NOT NULL,
    contact_person text,
    contact_email text,
    contact_phone text,
    billing_address text,
    payment_terms text,
    discount_rate numeric(5,2),
    credit_limit numeric(15,2),
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: corporate_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.corporate_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: corporate_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.corporate_clients_id_seq OWNED BY public.corporate_clients.id;


--
-- Name: hmo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hmo (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    policy_name text NOT NULL,
    provider text,
    coverage_details jsonb,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: hmo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hmo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hmo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hmo_id_seq OWNED BY public.hmo.id;


--
-- Name: hospitals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hospitals (
    id integer NOT NULL,
    name text NOT NULL,
    address text,
    contact_email text,
    phone_number text,
    subscription_plan text,
    active boolean DEFAULT true NOT NULL,
    logo_url text,
    primary_color text DEFAULT '#0F4C81'::text,
    secondary_color text DEFAULT '#4A90E2'::text,
    tagline text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: hospitals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hospitals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hospitals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hospitals_id_seq OWNED BY public.hospitals.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    item_name text NOT NULL,
    item_code text,
    stock_quantity integer DEFAULT 0 NOT NULL,
    reorder_level integer DEFAULT 10 NOT NULL,
    unit_price numeric(10,2),
    expiry_date date,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    amount numeric(10,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    patient_id integer NOT NULL,
    appointment_id integer,
    total_amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0 NOT NULL,
    status public."InvoiceStatus" NOT NULL,
    payment_method text,
    hmo_id integer,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: lab_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_orders (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    patient_id integer NOT NULL,
    ordered_by integer NOT NULL,
    order_type public."LabOrderType" NOT NULL,
    description text,
    status public."LabOrderStatus",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: lab_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_orders_id_seq OWNED BY public.lab_orders.id;


--
-- Name: lab_result_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_result_values (
    id integer NOT NULL,
    lab_result_id integer NOT NULL,
    test_name text NOT NULL,
    result_value text,
    unit text,
    normal_range text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lab_result_values_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_result_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_result_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_result_values_id_seq OWNED BY public.lab_result_values.id;


--
-- Name: lab_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_results (
    id integer NOT NULL,
    lab_order_id integer NOT NULL,
    uploaded_by integer NOT NULL,
    file_url text,
    result_notes text,
    finalized boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    released_at timestamp(3) without time zone,
    released_by integer,
    released_to_patient boolean DEFAULT false NOT NULL,
    doctor_note text
);


--
-- Name: lab_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_results_id_seq OWNED BY public.lab_results.id;


--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_records (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    visit_date date NOT NULL,
    diagnosis text,
    notes text,
    attachments jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: medical_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.medical_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: medical_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.medical_records_id_seq OWNED BY public.medical_records.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    user_id integer,
    sender_id integer,
    notification_type public."NotificationType" NOT NULL,
    reference_id integer,
    reference_table text,
    delivery_method public."DeliveryMethod" NOT NULL,
    message text NOT NULL,
    status public."NotificationStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_at timestamp(3) without time zone,
    read_at timestamp(3) without time zone
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: patient_surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_surveys (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    patient_id integer NOT NULL,
    survey_data jsonb NOT NULL,
    submitted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: patient_surveys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_surveys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_surveys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_surveys_id_seq OWNED BY public.patient_surveys.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    patient_type public."PatientType" DEFAULT 'self_pay'::public."PatientType" NOT NULL,
    corporate_client_id integer,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dob date NOT NULL,
    gender text,
    contact_info jsonb,
    address text,
    emergency_contact text,
    insurance_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    user_id integer,
    primary_doctor_id integer
);


--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    payment_date timestamp(3) without time zone NOT NULL,
    payment_gateway text,
    transaction_ref text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: prescription_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescription_items (
    id integer NOT NULL,
    prescription_id integer NOT NULL,
    drug_name text NOT NULL,
    dosage text,
    frequency text,
    duration text,
    notes text
);


--
-- Name: prescription_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prescription_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prescription_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prescription_items_id_seq OWNED BY public.prescription_items.id;


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescriptions (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    treatment_plan text,
    status public."PrescriptionStatus",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: prescriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prescriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prescriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prescriptions_id_seq OWNED BY public.prescriptions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    hashed_password text NOT NULL,
    role public."UserRole" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    last_login timestamp(3) without time zone,
    password_reset_token text,
    password_reset_expiry timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: analytics_dashboards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_dashboards ALTER COLUMN id SET DEFAULT nextval('public.analytics_dashboards_id_seq'::regclass);


--
-- Name: analytics_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_metrics ALTER COLUMN id SET DEFAULT nextval('public.analytics_metrics_id_seq'::regclass);


--
-- Name: analytics_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_reports ALTER COLUMN id SET DEFAULT nextval('public.analytics_reports_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: corporate_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.corporate_clients ALTER COLUMN id SET DEFAULT nextval('public.corporate_clients_id_seq'::regclass);


--
-- Name: hmo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hmo ALTER COLUMN id SET DEFAULT nextval('public.hmo_id_seq'::regclass);


--
-- Name: hospitals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospitals ALTER COLUMN id SET DEFAULT nextval('public.hospitals_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: lab_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders ALTER COLUMN id SET DEFAULT nextval('public.lab_orders_id_seq'::regclass);


--
-- Name: lab_result_values id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_result_values ALTER COLUMN id SET DEFAULT nextval('public.lab_result_values_id_seq'::regclass);


--
-- Name: lab_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results ALTER COLUMN id SET DEFAULT nextval('public.lab_results_id_seq'::regclass);


--
-- Name: medical_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records ALTER COLUMN id SET DEFAULT nextval('public.medical_records_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: patient_surveys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_surveys ALTER COLUMN id SET DEFAULT nextval('public.patient_surveys_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: prescription_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items ALTER COLUMN id SET DEFAULT nextval('public.prescription_items_id_seq'::regclass);


--
-- Name: prescriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions ALTER COLUMN id SET DEFAULT nextval('public.prescriptions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
02e9d3d3-10ac-41cb-8e73-59c1296e4f77	0f10d858ec4b4fb8e921a3819e4250693eec66a1be13f04967a673b54b394b9a	2025-10-17 20:09:30.422213+01	20251017185954_init	\N	\N	2025-10-17 20:09:30.194122+01	1
f16d7b3a-4776-4a05-a5d1-e7f95bd1049b	422a900898a971c4ac39eff1fc768e378711bf53fe5bb651fc20936e5b758483	2025-10-17 21:42:27.011582+01	20251017204226_add_lab_result_release_tracking	\N	\N	2025-10-17 21:42:26.988084+01	1
c7efde0b-c6a8-423a-9bc7-97c74b9080b1	826140aee452a70787fc850c643f9bac72a1d166031652a574e4146dc1fe43ca	2025-10-17 22:25:31.511184+01	20251017212531_add_patient_user_link	\N	\N	2025-10-17 22:25:31.498745+01	1
0530d9f6-e807-46f3-8380-32285a6a6b28	c77b27eef45e0a4f829a7e8716f7902728f4395e59a1a5582149f9087677c9ec	2025-10-18 00:26:34.052055+01	20251018_add_primary_doctor	\N	\N	2025-10-18 00:26:34.033094+01	1
736b7052-0334-4522-a412-9bd37093e793	38175ab1479657629a115f978b23eb058b94c993a9f066b55b3414f7b21643ce	2025-10-18 00:58:51.429347+01	20251018_add_doctor_note	\N	\N	2025-10-18 00:58:51.42481+01	1
\.


--
-- Data for Name: analytics_dashboards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics_dashboards (id, hospital_id, dashboard_name, dashboard_type, config, created_by, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: analytics_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics_metrics (id, hospital_id, metric_date, metric_type, metric_value, metric_unit, patient_type, additional_data, created_at) FROM stdin;
\.


--
-- Data for Name: analytics_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics_reports (id, hospital_id, report_type, report_period_start, report_period_end, generated_by, report_data, file_url, status, created_at) FROM stdin;
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.appointments (id, hospital_id, patient_id, doctor_id, department, appointment_type, status, start_time, end_time, created_at, updated_at) FROM stdin;
1	1	1	6	General	OPD	scheduled	2025-10-30 16:37:00	2025-10-30 17:07:00	2025-10-17 23:31:21.617	2025-10-17 23:31:21.617
\.


--
-- Data for Name: corporate_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.corporate_clients (id, hospital_id, company_name, contact_person, contact_email, contact_phone, billing_address, payment_terms, discount_rate, credit_limit, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hmo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hmo (id, hospital_id, policy_name, provider, coverage_details, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hospitals (id, name, address, contact_email, phone_number, subscription_plan, active, logo_url, primary_color, secondary_color, tagline, created_at, updated_at) FROM stdin;
1	City General Hospital	123 Medical Center Drive, Health City, HC 12345	info@citygeneralhospital.com	+1-555-123-4567	Premium	t	\N	#0F4C81	#4A90E2	\N	2025-10-17 19:09:30.985	2025-10-17 19:09:30.985
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory (id, hospital_id, item_name, item_code, stock_quantity, reorder_level, unit_price, expiry_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit_price, amount, created_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, hospital_id, patient_id, appointment_id, total_amount, paid_amount, status, payment_method, hmo_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lab_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lab_orders (id, hospital_id, patient_id, ordered_by, order_type, description, status, created_at, updated_at) FROM stdin;
1	1	1	6	Lab_Test	start it	completed	2025-10-17 23:34:04.802	2025-10-17 23:35:35.867
2	1	1	6	Lab_Test	new test again	completed	2025-10-18 01:17:57.442	2025-10-18 01:19:42.877
\.


--
-- Data for Name: lab_result_values; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lab_result_values (id, lab_result_id, test_name, result_value, unit, normal_range, created_at) FROM stdin;
1	1	good	new	23	Normal	2025-10-17 23:35:35.852
2	2	r	rr33	44	normal	2025-10-18 01:19:42.859
\.


--
-- Data for Name: lab_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lab_results (id, lab_order_id, uploaded_by, file_url, result_notes, finalized, created_at, updated_at, released_at, released_by, released_to_patient, doctor_note) FROM stdin;
1	1	19	\N	new test again	f	2025-10-17 23:35:35.852	2025-10-17 23:35:35.852	\N	\N	f	\N
2	2	18	\N	egerg	t	2025-10-18 01:19:42.859	2025-10-18 01:19:48.424	\N	\N	f	\N
\.


--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.medical_records (id, hospital_id, patient_id, doctor_id, visit_date, diagnosis, notes, attachments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, hospital_id, user_id, sender_id, notification_type, reference_id, reference_table, delivery_method, message, status, created_at, sent_at, read_at) FROM stdin;
\.


--
-- Data for Name: patient_surveys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_surveys (id, hospital_id, patient_id, survey_data, submitted_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (id, hospital_id, patient_type, corporate_client_id, first_name, last_name, dob, gender, contact_info, address, emergency_contact, insurance_id, created_at, updated_at, user_id, primary_doctor_id) FROM stdin;
1	1	self_pay	\N	John	Doe	2021-02-02	Male	{"email": "john@doe.com", "phone": "2334244"}	opolo	Emma father 09080994	\N	2025-10-17 23:30:09.119	2025-10-17 23:30:09.119	\N	6
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, invoice_id, amount_paid, payment_date, payment_gateway, transaction_ref, created_at) FROM stdin;
\.


--
-- Data for Name: prescription_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prescription_items (id, prescription_id, drug_name, dosage, frequency, duration, notes) FROM stdin;
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prescriptions (id, hospital_id, patient_id, doctor_id, treatment_plan, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, hospital_id, name, email, hashed_password, role, active, last_login, password_reset_token, password_reset_expiry, created_at, updated_at) FROM stdin;
1	1	Momentum Super Admin	superadmin@momentum.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	super_admin	t	\N	\N	\N	2025-10-17 19:09:31.081	2025-10-17 19:09:31.081
3	1	Dr. Sarah Johnson	sarah.johnson@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.091	2025-10-17 19:09:31.091
5	1	Dr. Michael Chen	michael.chen@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.099	2025-10-17 19:09:31.099
7	1	Eneyi Odey	vivieneneyiodey@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.102	2025-10-17 19:09:31.102
8	1	Glorious Kate Akpegah	gloriouskateakpegah@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.103	2025-10-17 19:09:31.103
9	1	Hope Adeyi	ayoigbala15@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.104	2025-10-17 19:09:31.104
10	1	Goroti Samuel	gorotisunkanmi@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.105	2025-10-17 19:09:31.105
11	1	Pharmacist David Brown	david.brown@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.107	2025-10-17 19:09:31.107
12	1	Babalola Oluwafemi	oluwafemibabalola99@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.108	2025-10-17 19:09:31.108
13	1	Shehu Arafah	missarafah@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.109	2025-10-17 19:09:31.109
14	1	Sadiq Abdulkadir	sadiqdahir323@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.111	2025-10-17 19:09:31.111
15	1	Tormene	torinco2020@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.112	2025-10-17 19:09:31.112
17	1	Lab Tech James Wilson	james.wilson@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	lab_tech	t	\N	\N	\N	2025-10-17 19:09:31.114	2025-10-17 19:09:31.114
20	1	Nnorom Iheoma	nnoromiheoma33@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	lab_tech	t	\N	\N	\N	2025-10-17 19:09:31.118	2025-10-17 19:09:31.118
21	1	Jumoke Johnson	damilolaj442@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	lab_tech	t	\N	\N	\N	2025-10-17 19:09:31.119	2025-10-17 19:09:31.119
22	1	Oluwanifemi Lanre-Adigun	nifemiadewura@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	lab_tech	t	\N	\N	\N	2025-10-17 19:09:31.12	2025-10-17 19:09:31.12
23	1	Cashier Lisa Anderson	lisa.anderson@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	cashier	t	\N	\N	\N	2025-10-17 19:09:31.122	2025-10-17 19:09:31.122
24	1	Olaide Olawuwo	truorganicafricafoundation@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	\N	\N	\N	2025-10-17 19:09:31.123	2025-10-17 19:09:31.123
25	1	Olajide Adara	olajideadara@yahoo.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	\N	\N	\N	2025-10-17 19:09:31.125	2025-10-17 19:09:31.125
27	1	Bello Ibrahim	ayindebolaji97@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	\N	\N	\N	2025-10-17 19:09:31.127	2025-10-17 19:09:31.127
28	1	Igbayilola Ruth	ruthigbayilola@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	\N	\N	\N	2025-10-17 19:09:31.128	2025-10-17 19:09:31.128
26	1	David Adeyinka	adeyinkad46@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	2025-10-17 19:16:41.364	\N	\N	2025-10-17 19:09:31.126	2025-10-17 19:16:41.368
19	1	Samuel Ajewole	samuelajewolesa@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	lab_tech	t	2025-10-18 00:08:10.564	\N	\N	2025-10-17 19:09:31.117	2025-10-18 00:08:10.567
16	1	Ukeme Udo	ukemeudo72@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	2025-10-18 00:13:43.075	\N	\N	2025-10-17 19:09:31.113	2025-10-18 00:13:43.078
6	1	Sylvia Aputazie	aputaziesylvia@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	2025-10-18 00:42:08.992	\N	\N	2025-10-17 19:09:31.101	2025-10-18 00:42:08.995
18	1	Baridueh Badon	baridueh@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	lab_tech	t	2025-10-18 01:19:01.394	\N	\N	2025-10-17 19:09:31.116	2025-10-18 01:19:01.398
2	1	Admin User	admin@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	admin	t	2025-10-18 01:22:02.705	\N	\N	2025-10-17 19:09:31.088	2025-10-18 01:22:02.708
4	1	Nurse Mary	nurse@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	nurse	t	2025-10-18 07:42:13.42	\N	\N	2025-10-17 19:09:31.094	2025-10-18 07:42:13.425
\.


--
-- Name: analytics_dashboards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.analytics_dashboards_id_seq', 1, false);


--
-- Name: analytics_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.analytics_metrics_id_seq', 1, false);


--
-- Name: analytics_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.analytics_reports_id_seq', 1, false);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.appointments_id_seq', 1, true);


--
-- Name: corporate_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.corporate_clients_id_seq', 1, false);


--
-- Name: hmo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hmo_id_seq', 1, false);


--
-- Name: hospitals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hospitals_id_seq', 1, false);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inventory_id_seq', 1, false);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- Name: lab_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lab_orders_id_seq', 2, true);


--
-- Name: lab_result_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lab_result_values_id_seq', 2, true);


--
-- Name: lab_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lab_results_id_seq', 2, true);


--
-- Name: medical_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.medical_records_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: patient_surveys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patient_surveys_id_seq', 1, false);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patients_id_seq', 1, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: prescription_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prescription_items_id_seq', 1, false);


--
-- Name: prescriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prescriptions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 28, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: analytics_dashboards analytics_dashboards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_dashboards
    ADD CONSTRAINT analytics_dashboards_pkey PRIMARY KEY (id);


--
-- Name: analytics_metrics analytics_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_metrics
    ADD CONSTRAINT analytics_metrics_pkey PRIMARY KEY (id);


--
-- Name: analytics_reports analytics_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_reports
    ADD CONSTRAINT analytics_reports_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: corporate_clients corporate_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.corporate_clients
    ADD CONSTRAINT corporate_clients_pkey PRIMARY KEY (id);


--
-- Name: hmo hmo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hmo
    ADD CONSTRAINT hmo_pkey PRIMARY KEY (id);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lab_orders lab_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_pkey PRIMARY KEY (id);


--
-- Name: lab_result_values lab_result_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_result_values
    ADD CONSTRAINT lab_result_values_pkey PRIMARY KEY (id);


--
-- Name: lab_results lab_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: patient_surveys patient_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_surveys
    ADD CONSTRAINT patient_surveys_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: prescription_items prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: analytics_dashboards_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_dashboards_hospital_id_idx ON public.analytics_dashboards USING btree (hospital_id);


--
-- Name: analytics_metrics_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_metrics_hospital_id_idx ON public.analytics_metrics USING btree (hospital_id);


--
-- Name: analytics_metrics_metric_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_metrics_metric_date_idx ON public.analytics_metrics USING btree (metric_date);


--
-- Name: analytics_metrics_metric_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_metrics_metric_type_idx ON public.analytics_metrics USING btree (metric_type);


--
-- Name: analytics_reports_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_reports_hospital_id_idx ON public.analytics_reports USING btree (hospital_id);


--
-- Name: analytics_reports_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX analytics_reports_status_idx ON public.analytics_reports USING btree (status);


--
-- Name: appointments_doctor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_doctor_id_idx ON public.appointments USING btree (doctor_id);


--
-- Name: appointments_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_hospital_id_idx ON public.appointments USING btree (hospital_id);


--
-- Name: appointments_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_patient_id_idx ON public.appointments USING btree (patient_id);


--
-- Name: appointments_start_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointments_start_time_idx ON public.appointments USING btree (start_time);


--
-- Name: corporate_clients_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX corporate_clients_hospital_id_idx ON public.corporate_clients USING btree (hospital_id);


--
-- Name: hmo_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hmo_hospital_id_idx ON public.hmo USING btree (hospital_id);


--
-- Name: inventory_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_hospital_id_idx ON public.inventory USING btree (hospital_id);


--
-- Name: inventory_item_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX inventory_item_code_key ON public.inventory USING btree (item_code);


--
-- Name: inventory_stock_quantity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_stock_quantity_idx ON public.inventory USING btree (stock_quantity);


--
-- Name: invoice_items_invoice_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoice_items_invoice_id_idx ON public.invoice_items USING btree (invoice_id);


--
-- Name: invoices_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_hospital_id_idx ON public.invoices USING btree (hospital_id);


--
-- Name: invoices_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_patient_id_idx ON public.invoices USING btree (patient_id);


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);


--
-- Name: lab_orders_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_orders_hospital_id_idx ON public.lab_orders USING btree (hospital_id);


--
-- Name: lab_orders_ordered_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_orders_ordered_by_idx ON public.lab_orders USING btree (ordered_by);


--
-- Name: lab_orders_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_orders_patient_id_idx ON public.lab_orders USING btree (patient_id);


--
-- Name: lab_orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_orders_status_idx ON public.lab_orders USING btree (status);


--
-- Name: lab_result_values_lab_result_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_result_values_lab_result_id_idx ON public.lab_result_values USING btree (lab_result_id);


--
-- Name: lab_results_lab_order_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_results_lab_order_id_idx ON public.lab_results USING btree (lab_order_id);


--
-- Name: lab_results_released_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_results_released_by_idx ON public.lab_results USING btree (released_by);


--
-- Name: lab_results_released_to_patient_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_results_released_to_patient_idx ON public.lab_results USING btree (released_to_patient);


--
-- Name: lab_results_uploaded_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_results_uploaded_by_idx ON public.lab_results USING btree (uploaded_by);


--
-- Name: medical_records_doctor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medical_records_doctor_id_idx ON public.medical_records USING btree (doctor_id);


--
-- Name: medical_records_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medical_records_hospital_id_idx ON public.medical_records USING btree (hospital_id);


--
-- Name: medical_records_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medical_records_patient_id_idx ON public.medical_records USING btree (patient_id);


--
-- Name: notifications_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_hospital_id_idx ON public.notifications USING btree (hospital_id);


--
-- Name: notifications_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_status_idx ON public.notifications USING btree (status);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: patient_surveys_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_surveys_hospital_id_idx ON public.patient_surveys USING btree (hospital_id);


--
-- Name: patient_surveys_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_surveys_patient_id_idx ON public.patient_surveys USING btree (patient_id);


--
-- Name: patients_corporate_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_corporate_client_id_idx ON public.patients USING btree (corporate_client_id);


--
-- Name: patients_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_hospital_id_idx ON public.patients USING btree (hospital_id);


--
-- Name: patients_insurance_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_insurance_id_idx ON public.patients USING btree (insurance_id);


--
-- Name: patients_primary_doctor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_primary_doctor_id_idx ON public.patients USING btree (primary_doctor_id);


--
-- Name: patients_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patients_user_id_idx ON public.patients USING btree (user_id);


--
-- Name: patients_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX patients_user_id_key ON public.patients USING btree (user_id);


--
-- Name: payments_invoice_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_invoice_id_idx ON public.payments USING btree (invoice_id);


--
-- Name: payments_transaction_ref_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payments_transaction_ref_key ON public.payments USING btree (transaction_ref);


--
-- Name: prescription_items_prescription_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX prescription_items_prescription_id_idx ON public.prescription_items USING btree (prescription_id);


--
-- Name: prescriptions_doctor_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX prescriptions_doctor_id_idx ON public.prescriptions USING btree (doctor_id);


--
-- Name: prescriptions_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX prescriptions_hospital_id_idx ON public.prescriptions USING btree (hospital_id);


--
-- Name: prescriptions_patient_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX prescriptions_patient_id_idx ON public.prescriptions USING btree (patient_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_hospital_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_hospital_id_idx ON public.users USING btree (hospital_id);


--
-- Name: users_password_reset_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_password_reset_token_idx ON public.users USING btree (password_reset_token);


--
-- Name: analytics_dashboards analytics_dashboards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_dashboards
    ADD CONSTRAINT analytics_dashboards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: analytics_dashboards analytics_dashboards_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_dashboards
    ADD CONSTRAINT analytics_dashboards_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: analytics_metrics analytics_metrics_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_metrics
    ADD CONSTRAINT analytics_metrics_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: analytics_reports analytics_reports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_reports
    ADD CONSTRAINT analytics_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: analytics_reports analytics_reports_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_reports
    ADD CONSTRAINT analytics_reports_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: corporate_clients corporate_clients_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.corporate_clients
    ADD CONSTRAINT corporate_clients_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: hmo hmo_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hmo
    ADD CONSTRAINT hmo_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory inventory_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_orders lab_orders_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_orders lab_orders_ordered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_ordered_by_fkey FOREIGN KEY (ordered_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_orders lab_orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_result_values lab_result_values_lab_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_result_values
    ADD CONSTRAINT lab_result_values_lab_result_id_fkey FOREIGN KEY (lab_result_id) REFERENCES public.lab_results(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lab_results lab_results_lab_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_lab_order_id_fkey FOREIGN KEY (lab_order_id) REFERENCES public.lab_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_results lab_results_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lab_results lab_results_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medical_records medical_records_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medical_records medical_records_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medical_records medical_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_surveys patient_surveys_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_surveys
    ADD CONSTRAINT patient_surveys_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_surveys patient_surveys_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_surveys
    ADD CONSTRAINT patient_surveys_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patients patients_corporate_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_corporate_client_id_fkey FOREIGN KEY (corporate_client_id) REFERENCES public.corporate_clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patients patients_insurance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_insurance_id_fkey FOREIGN KEY (insurance_id) REFERENCES public.hmo(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_primary_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_primary_doctor_id_fkey FOREIGN KEY (primary_doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescription_items prescription_items_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict OtearZyi6Pxh1zJsGCcKZtaLBBGburcq5ED8EjEVWDhyi9ann4vyvz7KhdiIUXC

