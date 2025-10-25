--
-- PostgreSQL database dump
--

\restrict yogWyg2DdrjJVnFVyXqVjB4GeFRDppEMwYffTP6nRQTiV8FM0b1PCmlpga2fktT

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'scheduled',
    'checked_in',
    'completed',
    'cancelled'
);


ALTER TYPE public."AppointmentStatus" OWNER TO postgres;

--
-- Name: AppointmentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AppointmentType" AS ENUM (
    'OPD',
    'IPD',
    'surgery',
    'lab',
    'follow_up'
);


ALTER TYPE public."AppointmentType" OWNER TO postgres;

--
-- Name: DashboardType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DashboardType" AS ENUM (
    'patient_volume',
    'revenue',
    'drug_statistics',
    'consultation_metrics',
    'operational'
);


ALTER TYPE public."DashboardType" OWNER TO postgres;

--
-- Name: DeliveryMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DeliveryMethod" AS ENUM (
    'email',
    'sms',
    'push',
    'in_app'
);


ALTER TYPE public."DeliveryMethod" OWNER TO postgres;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'pending',
    'paid',
    'cancelled',
    'refunded'
);


ALTER TYPE public."InvoiceStatus" OWNER TO postgres;

--
-- Name: LabOrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LabOrderStatus" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public."LabOrderStatus" OWNER TO postgres;

--
-- Name: LabOrderType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LabOrderType" AS ENUM (
    'Lab_Test',
    'X_ray',
    'CT_Scan',
    'MRI',
    'Ultrasound',
    'Pathology'
);


ALTER TYPE public."LabOrderType" OWNER TO postgres;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'pending',
    'sent',
    'read',
    'failed'
);


ALTER TYPE public."NotificationStatus" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'lab_order',
    'prescription_issued',
    'inventory_low',
    'appointment_reminder',
    'lab_result_ready',
    'payment_due',
    'account'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: PatientType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PatientType" AS ENUM (
    'hmo',
    'corporate',
    'self_pay'
);


ALTER TYPE public."PatientType" OWNER TO postgres;

--
-- Name: PrescriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PrescriptionStatus" AS ENUM (
    'active',
    'completed'
);


ALTER TYPE public."PrescriptionStatus" OWNER TO postgres;

--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."QuestionType" AS ENUM (
    'short_text',
    'long_text',
    'multiple_choice',
    'checkboxes',
    'rating',
    'yes_no',
    'date',
    'linear_scale'
);


ALTER TYPE public."QuestionType" OWNER TO postgres;

--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'generating',
    'completed',
    'failed'
);


ALTER TYPE public."ReportStatus" OWNER TO postgres;

--
-- Name: ReportType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReportType" AS ENUM (
    'daily_summary',
    'weekly_revenue',
    'monthly_patient_volume',
    'drug_usage',
    'consultation_times'
);


ALTER TYPE public."ReportType" OWNER TO postgres;

--
-- Name: SurveyStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SurveyStatus" AS ENUM (
    'draft',
    'active',
    'closed'
);


ALTER TYPE public."SurveyStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: analytics_dashboards; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.analytics_dashboards OWNER TO postgres;

--
-- Name: analytics_dashboards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analytics_dashboards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_dashboards_id_seq OWNER TO postgres;

--
-- Name: analytics_dashboards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analytics_dashboards_id_seq OWNED BY public.analytics_dashboards.id;


--
-- Name: analytics_metrics; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.analytics_metrics OWNER TO postgres;

--
-- Name: analytics_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analytics_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_metrics_id_seq OWNER TO postgres;

--
-- Name: analytics_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analytics_metrics_id_seq OWNED BY public.analytics_metrics.id;


--
-- Name: analytics_reports; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.analytics_reports OWNER TO postgres;

--
-- Name: analytics_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analytics_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_reports_id_seq OWNER TO postgres;

--
-- Name: analytics_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analytics_reports_id_seq OWNED BY public.analytics_reports.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: corporate_clients; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.corporate_clients OWNER TO postgres;

--
-- Name: corporate_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.corporate_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.corporate_clients_id_seq OWNER TO postgres;

--
-- Name: corporate_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.corporate_clients_id_seq OWNED BY public.corporate_clients.id;


--
-- Name: hmo; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.hmo OWNER TO postgres;

--
-- Name: hmo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hmo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hmo_id_seq OWNER TO postgres;

--
-- Name: hmo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hmo_id_seq OWNED BY public.hmo.id;


--
-- Name: hospitals; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.hospitals OWNER TO postgres;

--
-- Name: hospitals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hospitals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hospitals_id_seq OWNER TO postgres;

--
-- Name: hospitals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitals_id_seq OWNED BY public.hospitals.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.inventory OWNER TO postgres;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_id_seq OWNER TO postgres;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.invoice_items OWNER TO postgres;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_items_id_seq OWNER TO postgres;

--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: lab_orders; Type: TABLE; Schema: public; Owner: postgres
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
    updated_at timestamp(3) without time zone NOT NULL,
    assigned_to integer
);


ALTER TABLE public.lab_orders OWNER TO postgres;

--
-- Name: lab_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lab_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lab_orders_id_seq OWNER TO postgres;

--
-- Name: lab_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lab_orders_id_seq OWNED BY public.lab_orders.id;


--
-- Name: lab_result_values; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.lab_result_values OWNER TO postgres;

--
-- Name: lab_result_values_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lab_result_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lab_result_values_id_seq OWNER TO postgres;

--
-- Name: lab_result_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lab_result_values_id_seq OWNED BY public.lab_result_values.id;


--
-- Name: lab_results; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.lab_results OWNER TO postgres;

--
-- Name: lab_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lab_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lab_results_id_seq OWNER TO postgres;

--
-- Name: lab_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lab_results_id_seq OWNED BY public.lab_results.id;


--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.medical_records OWNER TO postgres;

--
-- Name: medical_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medical_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_records_id_seq OWNER TO postgres;

--
-- Name: medical_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medical_records_id_seq OWNED BY public.medical_records.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: patient_surveys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_surveys (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    patient_id integer NOT NULL,
    survey_data jsonb NOT NULL,
    submitted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.patient_surveys OWNER TO postgres;

--
-- Name: patient_surveys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patient_surveys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_surveys_id_seq OWNER TO postgres;

--
-- Name: patient_surveys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patient_surveys_id_seq OWNED BY public.patient_surveys.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_id_seq OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: prescription_items; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.prescription_items OWNER TO postgres;

--
-- Name: prescription_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prescription_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescription_items_id_seq OWNER TO postgres;

--
-- Name: prescription_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prescription_items_id_seq OWNED BY public.prescription_items.id;


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.prescriptions OWNER TO postgres;

--
-- Name: prescriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prescriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescriptions_id_seq OWNER TO postgres;

--
-- Name: prescriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prescriptions_id_seq OWNED BY public.prescriptions.id;


--
-- Name: survey_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_answers (
    id integer NOT NULL,
    response_id integer NOT NULL,
    question_id integer NOT NULL,
    answer text NOT NULL
);


ALTER TABLE public.survey_answers OWNER TO postgres;

--
-- Name: survey_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_answers_id_seq OWNER TO postgres;

--
-- Name: survey_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_answers_id_seq OWNED BY public.survey_answers.id;


--
-- Name: survey_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_questions (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    question_text text NOT NULL,
    question_type public."QuestionType" NOT NULL,
    options jsonb,
    required boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.survey_questions OWNER TO postgres;

--
-- Name: survey_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_questions_id_seq OWNER TO postgres;

--
-- Name: survey_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_questions_id_seq OWNED BY public.survey_questions.id;


--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_responses (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    patient_id integer NOT NULL,
    completed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.survey_responses OWNER TO postgres;

--
-- Name: survey_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_responses_id_seq OWNER TO postgres;

--
-- Name: survey_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_responses_id_seq OWNED BY public.survey_responses.id;


--
-- Name: surveys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.surveys (
    id integer NOT NULL,
    hospital_id integer NOT NULL,
    title text NOT NULL,
    description text,
    status public."SurveyStatus" DEFAULT 'draft'::public."SurveyStatus" NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.surveys OWNER TO postgres;

--
-- Name: surveys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.surveys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.surveys_id_seq OWNER TO postgres;

--
-- Name: surveys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.surveys_id_seq OWNED BY public.surveys.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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
    updated_at timestamp(3) without time zone NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: analytics_dashboards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_dashboards ALTER COLUMN id SET DEFAULT nextval('public.analytics_dashboards_id_seq'::regclass);


--
-- Name: analytics_metrics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_metrics ALTER COLUMN id SET DEFAULT nextval('public.analytics_metrics_id_seq'::regclass);


--
-- Name: analytics_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_reports ALTER COLUMN id SET DEFAULT nextval('public.analytics_reports_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: corporate_clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.corporate_clients ALTER COLUMN id SET DEFAULT nextval('public.corporate_clients_id_seq'::regclass);


--
-- Name: hmo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hmo ALTER COLUMN id SET DEFAULT nextval('public.hmo_id_seq'::regclass);


--
-- Name: hospitals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals ALTER COLUMN id SET DEFAULT nextval('public.hospitals_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: lab_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders ALTER COLUMN id SET DEFAULT nextval('public.lab_orders_id_seq'::regclass);


--
-- Name: lab_result_values id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_result_values ALTER COLUMN id SET DEFAULT nextval('public.lab_result_values_id_seq'::regclass);


--
-- Name: lab_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_results ALTER COLUMN id SET DEFAULT nextval('public.lab_results_id_seq'::regclass);


--
-- Name: medical_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records ALTER COLUMN id SET DEFAULT nextval('public.medical_records_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: patient_surveys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_surveys ALTER COLUMN id SET DEFAULT nextval('public.patient_surveys_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: prescription_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_items ALTER COLUMN id SET DEFAULT nextval('public.prescription_items_id_seq'::regclass);


--
-- Name: prescriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions ALTER COLUMN id SET DEFAULT nextval('public.prescriptions_id_seq'::regclass);


--
-- Name: survey_answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_answers ALTER COLUMN id SET DEFAULT nextval('public.survey_answers_id_seq'::regclass);


--
-- Name: survey_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions ALTER COLUMN id SET DEFAULT nextval('public.survey_questions_id_seq'::regclass);


--
-- Name: survey_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses ALTER COLUMN id SET DEFAULT nextval('public.survey_responses_id_seq'::regclass);


--
-- Name: surveys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys ALTER COLUMN id SET DEFAULT nextval('public.surveys_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
02e9d3d3-10ac-41cb-8e73-59c1296e4f77	0f10d858ec4b4fb8e921a3819e4250693eec66a1be13f04967a673b54b394b9a	2025-10-17 20:09:30.422213+01	20251017185954_init	\N	\N	2025-10-17 20:09:30.194122+01	1
f16d7b3a-4776-4a05-a5d1-e7f95bd1049b	422a900898a971c4ac39eff1fc768e378711bf53fe5bb651fc20936e5b758483	2025-10-17 21:42:27.011582+01	20251017204226_add_lab_result_release_tracking	\N	\N	2025-10-17 21:42:26.988084+01	1
c7efde0b-c6a8-423a-9bc7-97c74b9080b1	826140aee452a70787fc850c643f9bac72a1d166031652a574e4146dc1fe43ca	2025-10-17 22:25:31.511184+01	20251017212531_add_patient_user_link	\N	\N	2025-10-17 22:25:31.498745+01	1
0530d9f6-e807-46f3-8380-32285a6a6b28	c77b27eef45e0a4f829a7e8716f7902728f4395e59a1a5582149f9087677c9ec	2025-10-18 00:26:34.052055+01	20251018_add_primary_doctor	\N	\N	2025-10-18 00:26:34.033094+01	1
736b7052-0334-4522-a412-9bd37093e793	38175ab1479657629a115f978b23eb058b94c993a9f066b55b3414f7b21643ce	2025-10-18 00:58:51.429347+01	20251018_add_doctor_note	\N	\N	2025-10-18 00:58:51.42481+01	1
ed9b9bc4-06f3-445e-b80d-5bab357a5446	36e0f77b2ac0638953d341bb400800a94f48cef6c66cbc4bf7ca8dffab7749f2	2025-10-19 22:43:06.056729+01	20251019214306_add_surveys	\N	\N	2025-10-19 22:43:06.026239+01	1
93c73a77-a828-417d-bb3b-2fdd3c6c903f	4383c65638a77fdd4947b2a304fab70737c9d3e1ee7706fc32334038e0279582	2025-10-19 23:16:44.082093+01	20251019221644_update_surveys_with_questions	\N	\N	2025-10-19 23:16:44.053128+01	1
42b1522a-9270-4e6e-a7a6-f405a0b09132	ca6e9c7c753eda0796d0cc98d2f3b6572c284a4ac7269ba02604680e049244a4	2025-10-21 08:51:20.693496+01	20251021075120_add_must_change_password	\N	\N	2025-10-21 08:51:20.68738+01	1
9ce79f39-fe8e-46c5-8c61-feb05e729efe	aaceacc5e5c653fc40e6ce9536b6a5106a37e47c7f3f5f3e7403d922a1c050b0	2025-10-21 09:24:03.879109+01	20251021082403_add_account_notification_type	\N	\N	2025-10-21 09:24:03.872775+01	1
9a61910a-88d9-4c0a-b873-6889ae75b1bd	a8b994a95347a51e6a249481bf41dae76943bb4c1eedc1e61e4078d1a9692e0c	2025-10-21 19:35:10.490253+01	20251021183510_add_lab_order_assignment	\N	\N	2025-10-21 19:35:10.47271+01	1
\.


--
-- Data for Name: analytics_dashboards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analytics_dashboards (id, hospital_id, dashboard_name, dashboard_type, config, created_by, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: analytics_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analytics_metrics (id, hospital_id, metric_date, metric_type, metric_value, metric_unit, patient_type, additional_data, created_at) FROM stdin;
\.


--
-- Data for Name: analytics_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analytics_reports (id, hospital_id, report_type, report_period_start, report_period_end, generated_by, report_data, file_url, status, created_at) FROM stdin;
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, hospital_id, patient_id, doctor_id, department, appointment_type, status, start_time, end_time, created_at, updated_at) FROM stdin;
1	1	1	6	General	OPD	scheduled	2025-10-30 16:37:00	2025-10-30 17:07:00	2025-10-17 23:31:21.617	2025-10-17 23:31:21.617
2	1	1	6	Cardiology	IPD	scheduled	2025-10-30 09:00:00	2025-10-30 09:30:00	2025-10-22 07:45:04.031	2025-10-22 07:45:04.031
\.


--
-- Data for Name: corporate_clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.corporate_clients (id, hospital_id, company_name, contact_person, contact_email, contact_phone, billing_address, payment_terms, discount_rate, credit_limit, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hmo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hmo (id, hospital_id, policy_name, provider, coverage_details, active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitals (id, name, address, contact_email, phone_number, subscription_plan, active, logo_url, primary_color, secondary_color, tagline, created_at, updated_at) FROM stdin;
1	City General Hospital	123 Medical Center Drive, Health City, HC 12345	info@citygeneralhospital.com	+1-555-123-4567	Premium	t	https://f005.backblazeb2.com/file/emr-uploads/logos/b990a4f0-0d4f-40d6-b38c-a420999bd6b8.png	#0F4C81	#4A90E2		2025-10-17 19:09:30.985	2025-10-20 10:33:04.781
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (id, hospital_id, item_name, item_code, stock_quantity, reorder_level, unit_price, expiry_date, created_at, updated_at) FROM stdin;
1	1	Paracetamol	\N	1	10	400.00	2028-06-22	2025-10-19 20:06:55.45	2025-10-19 20:06:55.45
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoice_items (id, invoice_id, description, quantity, unit_price, amount, created_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, hospital_id, patient_id, appointment_id, total_amount, paid_amount, status, payment_method, hmo_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lab_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_orders (id, hospital_id, patient_id, ordered_by, order_type, description, status, created_at, updated_at, assigned_to) FROM stdin;
1	1	1	6	Lab_Test	start it	completed	2025-10-17 23:34:04.802	2025-10-17 23:35:35.867	\N
2	1	1	6	Lab_Test	new test again	completed	2025-10-18 01:17:57.442	2025-10-18 01:19:42.877	\N
3	1	1	6	Lab_Test	yuguyg	completed	2025-10-21 15:35:37.493	2025-10-21 15:37:17.004	\N
4	1	1	6	Lab_Test	rggrgw	completed	2025-10-21 15:54:10.499	2025-10-21 15:55:00.093	\N
5	1	1	6	Ultrasound	New one	completed	2025-10-21 18:23:21.931	2025-10-21 18:24:20.999	\N
6	1	1	6	Pathology	Pathological test type	completed	2025-10-22 06:54:10.998	2025-10-22 06:55:16.666	\N
\.


--
-- Data for Name: lab_result_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_result_values (id, lab_result_id, test_name, result_value, unit, normal_range, created_at) FROM stdin;
1	1	good	new	23	Normal	2025-10-17 23:35:35.852
2	2	r	rr33	44	normal	2025-10-18 01:19:42.859
3	3	new	sult	3	Normal	2025-10-21 15:37:16.923
4	4	chilll	sdf	34	normal	2025-10-21 15:55:00.07
5	5	new test	result clean	5	normal	2025-10-21 18:24:20.977
6	6	main	new	0.02	Abnormal	2025-10-22 06:55:16.65
\.


--
-- Data for Name: lab_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lab_results (id, lab_order_id, uploaded_by, file_url, result_notes, finalized, created_at, updated_at, released_at, released_by, released_to_patient, doctor_note) FROM stdin;
2	2	18	\N	egerg	t	2025-10-18 01:19:42.859	2025-10-18 01:19:48.424	\N	\N	f	\N
3	3	18	\N	new update	t	2025-10-21 15:37:16.923	2025-10-21 15:37:33.463	\N	\N	f	\N
4	4	18	\N	rfrf	t	2025-10-21 15:55:00.07	2025-10-21 15:55:53.476	2025-10-21 15:55:53.474	6	t	\N
1	1	19	\N	new test again	t	2025-10-17 23:35:35.852	2025-10-21 18:14:01.58	\N	\N	f	\N
5	5	18	\N	good	t	2025-10-21 18:24:20.977	2025-10-21 18:24:40.36	2025-10-21 18:24:40.359	6	t	\N
6	6	18	\N	New pathology	f	2025-10-22 06:55:16.65	2025-10-22 06:55:16.65	\N	\N	f	\N
\.


--
-- Data for Name: medical_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medical_records (id, hospital_id, patient_id, doctor_id, visit_date, diagnosis, notes, attachments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, hospital_id, user_id, sender_id, notification_type, reference_id, reference_table, delivery_method, message, status, created_at, sent_at, read_at) FROM stdin;
3	1	34	\N	account	5	patients	in_app	Welcome! Your patient account has been created. Please check your email for login credentials.	sent	2025-10-21 09:49:46.711	2025-10-21 09:49:46.705	\N
\.


--
-- Data for Name: patient_surveys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient_surveys (id, hospital_id, patient_id, survey_data, submitted_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, hospital_id, patient_type, corporate_client_id, first_name, last_name, dob, gender, contact_info, address, emergency_contact, insurance_id, created_at, updated_at, user_id, primary_doctor_id) FROM stdin;
1	1	self_pay	\N	John	Doe	2021-02-02	Male	{"email": "john@doe.com", "phone": "2334244"}	opolo	Emma father 09080994	\N	2025-10-17 23:30:09.119	2025-10-17 23:30:09.119	\N	6
5	1	self_pay	\N	Emmanuel	Frank-Opigo	2022-05-10	Male	{"email": "emmanuelmieye@gmail.com", "phone": "+2347050322778"}	No.5 Road 5 D44	+2347050322778	\N	2025-10-21 09:49:46.693	2025-10-21 09:49:46.693	34	8
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, invoice_id, amount_paid, payment_date, payment_gateway, transaction_ref, created_at) FROM stdin;
\.


--
-- Data for Name: prescription_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescription_items (id, prescription_id, drug_name, dosage, frequency, duration, notes) FROM stdin;
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescriptions (id, hospital_id, patient_id, doctor_id, treatment_plan, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: survey_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_answers (id, response_id, question_id, answer) FROM stdin;
\.


--
-- Data for Name: survey_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_questions (id, survey_id, question_text, question_type, options, required, "order", created_at) FROM stdin;
\.


--
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_responses (id, survey_id, patient_id, completed_at) FROM stdin;
\.


--
-- Data for Name: surveys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.surveys (id, hospital_id, title, description, status, created_by, created_at, updated_at) FROM stdin;
1	1	Test	about doctors	draft	2	2025-10-19 22:03:01.972	2025-10-19 22:03:01.972
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, hospital_id, name, email, hashed_password, role, active, last_login, password_reset_token, password_reset_expiry, created_at, updated_at, must_change_password) FROM stdin;
5	1	Dr. Michael Chen	michael.chen@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.099	2025-10-17 19:09:31.099	f
7	1	Eneyi Odey	vivieneneyiodey@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.102	2025-10-17 19:09:31.102	f
8	1	Glorious Kate Akpegah	gloriouskateakpegah@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.103	2025-10-17 19:09:31.103	f
9	1	Hope Adeyi	ayoigbala15@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.104	2025-10-17 19:09:31.104	f
10	1	Goroti Samuel	gorotisunkanmi@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	\N	\N	\N	2025-10-17 19:09:31.105	2025-10-17 19:09:31.105	f
11	1	Pharmacist David Brown	david.brown@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.107	2025-10-17 19:09:31.107	f
12	1	Babalola Oluwafemi	oluwafemibabalola99@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.108	2025-10-17 19:09:31.108	f
14	1	Sadiq Abdulkadir	sadiqdahir323@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.111	2025-10-17 19:09:31.111	f
15	1	Tormene	torinco2020@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	\N	\N	\N	2025-10-17 19:09:31.112	2025-10-17 19:09:31.112	f
23	1	Cashier Lisa Anderson	lisa.anderson@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	cashier	t	\N	\N	\N	2025-10-17 19:09:31.122	2025-10-17 19:09:31.122	f
24	1	Olaide Olawuwo	truorganicafricafoundation@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	\N	\N	\N	2025-10-17 19:09:31.123	2025-10-17 19:09:31.123	f
27	1	Bello Ibrahim	ayindebolaji97@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	\N	\N	\N	2025-10-17 19:09:31.127	2025-10-17 19:09:31.127	f
28	1	Igbayilola Ruth	ruthigbayilola@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	\N	\N	\N	2025-10-17 19:09:31.128	2025-10-17 19:09:31.128	f
26	1	David Adeyinka	adeyinkad46@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	2025-10-17 19:16:41.364	\N	\N	2025-10-17 19:09:31.126	2025-10-17 19:16:41.368	f
2	1	Admin User	admin@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	admin	t	2025-10-21 07:46:45.422	\N	\N	2025-10-17 19:09:31.088	2025-10-21 07:46:45.424	f
16	1	Ukeme Udo	ukemeudo72@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	2025-10-18 00:13:43.075	\N	\N	2025-10-17 19:09:31.113	2025-10-18 00:13:43.078	f
6	1	Sylvia Aputazie	aputaziesylvia@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	2025-10-18 00:42:08.992	\N	\N	2025-10-17 19:09:31.101	2025-10-18 00:42:08.995	f
17	1	Lab Tech James Wilson	james.wilson@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	nurse	t	\N	\N	\N	2025-10-17 19:09:31.114	2025-10-24 07:16:11.806	f
4	1	Nurse Mary	nurse@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	nurse	t	2025-10-18 07:42:13.42	\N	\N	2025-10-17 19:09:31.094	2025-10-18 07:42:13.425	f
20	1	Nnorom Iheoma	nnoromiheoma33@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	nurse	t	\N	\N	\N	2025-10-17 19:09:31.118	2025-10-24 07:16:11.806	f
34	1	Emmanuel Frank-Opigo	emmanuelmieye@gmail.com	$2a$10$ZyN5z0gu/vFzdKGUFtwvvO2z2BChzygqz6VLL.DW1PEBtF5PpJWGq	patient	t	\N	\N	\N	2025-10-21 09:49:46.684	2025-10-21 09:49:46.684	t
25	1	Olajide Adara	olajideadara@yahoo.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	patient	t	2025-10-22 07:25:08.892	\N	\N	2025-10-17 19:09:31.125	2025-10-22 07:25:08.895	f
3	1	Dr. Sarah Johnson	sarah.johnson@citygeneralhospital.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	doctor	t	2025-10-22 17:29:58.004	\N	\N	2025-10-17 19:09:31.091	2025-10-22 17:29:58.01	f
21	1	Jumoke Johnson	damilolaj442@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	nurse	t	\N	\N	\N	2025-10-17 19:09:31.119	2025-10-24 07:16:11.806	f
22	1	Oluwanifemi Lanre-Adigun	nifemiadewura@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	nurse	t	\N	\N	\N	2025-10-17 19:09:31.12	2025-10-24 07:16:11.806	f
1	1	Momentum Super Admin	superadmin@momentum.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	super_admin	t	2025-10-23 09:05:23.515	\N	\N	2025-10-17 19:09:31.081	2025-10-23 09:05:23.522	f
30	1	Peter Imonte	imontepez@gmail.com	$2a$10$DPZXcUii31VG3QE/LgZbiul6ATVizdO8XIb61y6y5qgP0Y8T59dzy	nurse	t	2025-10-21 07:38:36.895	\N	\N	2025-10-21 07:38:02.742	2025-10-24 07:16:11.806	f
19	1	Samuel Ajewole	samuelajewolesa@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	nurse	t	2025-10-18 00:08:10.564	\N	\N	2025-10-17 19:09:31.117	2025-10-24 07:16:11.806	f
18	1	Baridueh Badon	baridueh@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	nurse	t	2025-10-21 14:21:41.621	\N	\N	2025-10-17 19:09:31.116	2025-10-24 07:16:11.806	f
13	1	Shehu Arafah	missarafah@gmail.com	$2a$10$HLXCTUQD4D2WKymp3xj9NuA2oEavDhZi0LaC6ZOgOAyYIHaNmQl4W	pharmacist	t	2025-10-24 18:32:06.36	\N	\N	2025-10-17 19:09:31.109	2025-10-24 18:32:06.363	f
\.


--
-- Name: analytics_dashboards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analytics_dashboards_id_seq', 1, false);


--
-- Name: analytics_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analytics_metrics_id_seq', 1, false);


--
-- Name: analytics_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analytics_reports_id_seq', 1, false);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_seq', 2, true);


--
-- Name: corporate_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.corporate_clients_id_seq', 1, false);


--
-- Name: hmo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hmo_id_seq', 1, false);


--
-- Name: hospitals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospitals_id_seq', 1, false);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_id_seq', 1, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- Name: lab_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lab_orders_id_seq', 6, true);


--
-- Name: lab_result_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lab_result_values_id_seq', 6, true);


--
-- Name: lab_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lab_results_id_seq', 6, true);


--
-- Name: medical_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medical_records_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 3, true);


--
-- Name: patient_surveys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patient_surveys_id_seq', 1, false);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_id_seq', 5, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: prescription_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescription_items_id_seq', 1, false);


--
-- Name: prescriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescriptions_id_seq', 1, false);


--
-- Name: survey_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_answers_id_seq', 1, false);


--
-- Name: survey_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_questions_id_seq', 1, false);


--
-- Name: survey_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_responses_id_seq', 1, false);


--
-- Name: surveys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.surveys_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 34, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: analytics_dashboards analytics_dashboards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_dashboards
    ADD CONSTRAINT analytics_dashboards_pkey PRIMARY KEY (id);


--
-- Name: analytics_metrics analytics_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_metrics
    ADD CONSTRAINT analytics_metrics_pkey PRIMARY KEY (id);


--
-- Name: analytics_reports analytics_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_reports
    ADD CONSTRAINT analytics_reports_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: corporate_clients corporate_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.corporate_clients
    ADD CONSTRAINT corporate_clients_pkey PRIMARY KEY (id);


--
-- Name: hmo hmo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hmo
    ADD CONSTRAINT hmo_pkey PRIMARY KEY (id);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lab_orders lab_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_pkey PRIMARY KEY (id);


--
-- Name: lab_result_values lab_result_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_result_values
    ADD CONSTRAINT lab_result_values_pkey PRIMARY KEY (id);


--
-- Name: lab_results lab_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: patient_surveys patient_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_surveys
    ADD CONSTRAINT patient_surveys_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: prescription_items prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: survey_answers survey_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_answers
    ADD CONSTRAINT survey_answers_pkey PRIMARY KEY (id);


--
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: analytics_dashboards_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX analytics_dashboards_hospital_id_idx ON public.analytics_dashboards USING btree (hospital_id);


--
-- Name: analytics_metrics_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX analytics_metrics_hospital_id_idx ON public.analytics_metrics USING btree (hospital_id);


--
-- Name: analytics_metrics_metric_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX analytics_metrics_metric_date_idx ON public.analytics_metrics USING btree (metric_date);


--
-- Name: analytics_metrics_metric_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX analytics_metrics_metric_type_idx ON public.analytics_metrics USING btree (metric_type);


--
-- Name: analytics_reports_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX analytics_reports_hospital_id_idx ON public.analytics_reports USING btree (hospital_id);


--
-- Name: analytics_reports_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX analytics_reports_status_idx ON public.analytics_reports USING btree (status);


--
-- Name: appointments_doctor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_doctor_id_idx ON public.appointments USING btree (doctor_id);


--
-- Name: appointments_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_hospital_id_idx ON public.appointments USING btree (hospital_id);


--
-- Name: appointments_patient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_patient_id_idx ON public.appointments USING btree (patient_id);


--
-- Name: appointments_start_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_start_time_idx ON public.appointments USING btree (start_time);


--
-- Name: corporate_clients_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX corporate_clients_hospital_id_idx ON public.corporate_clients USING btree (hospital_id);


--
-- Name: hmo_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX hmo_hospital_id_idx ON public.hmo USING btree (hospital_id);


--
-- Name: inventory_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inventory_hospital_id_idx ON public.inventory USING btree (hospital_id);


--
-- Name: inventory_item_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX inventory_item_code_key ON public.inventory USING btree (item_code);


--
-- Name: inventory_stock_quantity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX inventory_stock_quantity_idx ON public.inventory USING btree (stock_quantity);


--
-- Name: invoice_items_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoice_items_invoice_id_idx ON public.invoice_items USING btree (invoice_id);


--
-- Name: invoices_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_hospital_id_idx ON public.invoices USING btree (hospital_id);


--
-- Name: invoices_patient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_patient_id_idx ON public.invoices USING btree (patient_id);


--
-- Name: invoices_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX invoices_status_idx ON public.invoices USING btree (status);


--
-- Name: lab_orders_assigned_to_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_orders_assigned_to_idx ON public.lab_orders USING btree (assigned_to);


--
-- Name: lab_orders_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_orders_hospital_id_idx ON public.lab_orders USING btree (hospital_id);


--
-- Name: lab_orders_ordered_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_orders_ordered_by_idx ON public.lab_orders USING btree (ordered_by);


--
-- Name: lab_orders_patient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_orders_patient_id_idx ON public.lab_orders USING btree (patient_id);


--
-- Name: lab_orders_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_orders_status_idx ON public.lab_orders USING btree (status);


--
-- Name: lab_result_values_lab_result_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_result_values_lab_result_id_idx ON public.lab_result_values USING btree (lab_result_id);


--
-- Name: lab_results_lab_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_results_lab_order_id_idx ON public.lab_results USING btree (lab_order_id);


--
-- Name: lab_results_released_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_results_released_by_idx ON public.lab_results USING btree (released_by);


--
-- Name: lab_results_released_to_patient_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_results_released_to_patient_idx ON public.lab_results USING btree (released_to_patient);


--
-- Name: lab_results_uploaded_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lab_results_uploaded_by_idx ON public.lab_results USING btree (uploaded_by);


--
-- Name: medical_records_doctor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX medical_records_doctor_id_idx ON public.medical_records USING btree (doctor_id);


--
-- Name: medical_records_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX medical_records_hospital_id_idx ON public.medical_records USING btree (hospital_id);


--
-- Name: medical_records_patient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX medical_records_patient_id_idx ON public.medical_records USING btree (patient_id);


--
-- Name: notifications_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_hospital_id_idx ON public.notifications USING btree (hospital_id);


--
-- Name: notifications_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_status_idx ON public.notifications USING btree (status);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: patient_surveys_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patient_surveys_hospital_id_idx ON public.patient_surveys USING btree (hospital_id);


--
-- Name: patient_surveys_patient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patient_surveys_patient_id_idx ON public.patient_surveys USING btree (patient_id);


--
-- Name: patients_corporate_client_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patients_corporate_client_id_idx ON public.patients USING btree (corporate_client_id);


--
-- Name: patients_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patients_hospital_id_idx ON public.patients USING btree (hospital_id);


--
-- Name: patients_insurance_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patients_insurance_id_idx ON public.patients USING btree (insurance_id);


--
-- Name: patients_primary_doctor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patients_primary_doctor_id_idx ON public.patients USING btree (primary_doctor_id);


--
-- Name: patients_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patients_user_id_idx ON public.patients USING btree (user_id);


--
-- Name: patients_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX patients_user_id_key ON public.patients USING btree (user_id);


--
-- Name: payments_invoice_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_invoice_id_idx ON public.payments USING btree (invoice_id);


--
-- Name: payments_transaction_ref_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_transaction_ref_key ON public.payments USING btree (transaction_ref);


--
-- Name: prescription_items_prescription_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX prescription_items_prescription_id_idx ON public.prescription_items USING btree (prescription_id);


--
-- Name: prescriptions_doctor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX prescriptions_doctor_id_idx ON public.prescriptions USING btree (doctor_id);


--
-- Name: prescriptions_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX prescriptions_hospital_id_idx ON public.prescriptions USING btree (hospital_id);


--
-- Name: prescriptions_patient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX prescriptions_patient_id_idx ON public.prescriptions USING btree (patient_id);


--
-- Name: survey_answers_question_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX survey_answers_question_id_idx ON public.survey_answers USING btree (question_id);


--
-- Name: survey_answers_response_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX survey_answers_response_id_idx ON public.survey_answers USING btree (response_id);


--
-- Name: survey_questions_survey_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX survey_questions_survey_id_idx ON public.survey_questions USING btree (survey_id);


--
-- Name: survey_responses_patient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX survey_responses_patient_id_idx ON public.survey_responses USING btree (patient_id);


--
-- Name: survey_responses_survey_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX survey_responses_survey_id_idx ON public.survey_responses USING btree (survey_id);


--
-- Name: survey_responses_survey_id_patient_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX survey_responses_survey_id_patient_id_key ON public.survey_responses USING btree (survey_id, patient_id);


--
-- Name: surveys_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX surveys_hospital_id_idx ON public.surveys USING btree (hospital_id);


--
-- Name: surveys_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX surveys_status_idx ON public.surveys USING btree (status);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_hospital_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_hospital_id_idx ON public.users USING btree (hospital_id);


--
-- Name: users_password_reset_token_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_password_reset_token_idx ON public.users USING btree (password_reset_token);


--
-- Name: analytics_dashboards analytics_dashboards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_dashboards
    ADD CONSTRAINT analytics_dashboards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: analytics_dashboards analytics_dashboards_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_dashboards
    ADD CONSTRAINT analytics_dashboards_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: analytics_metrics analytics_metrics_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_metrics
    ADD CONSTRAINT analytics_metrics_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: analytics_reports analytics_reports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_reports
    ADD CONSTRAINT analytics_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: analytics_reports analytics_reports_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_reports
    ADD CONSTRAINT analytics_reports_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: corporate_clients corporate_clients_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.corporate_clients
    ADD CONSTRAINT corporate_clients_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: hmo hmo_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hmo
    ADD CONSTRAINT hmo_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory inventory_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_orders lab_orders_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lab_orders lab_orders_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_orders lab_orders_ordered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_ordered_by_fkey FOREIGN KEY (ordered_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_orders lab_orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_orders
    ADD CONSTRAINT lab_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_result_values lab_result_values_lab_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_result_values
    ADD CONSTRAINT lab_result_values_lab_result_id_fkey FOREIGN KEY (lab_result_id) REFERENCES public.lab_results(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lab_results lab_results_lab_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_lab_order_id_fkey FOREIGN KEY (lab_order_id) REFERENCES public.lab_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_results lab_results_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lab_results lab_results_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medical_records medical_records_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medical_records medical_records_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: medical_records medical_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_surveys patient_surveys_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_surveys
    ADD CONSTRAINT patient_surveys_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_surveys patient_surveys_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_surveys
    ADD CONSTRAINT patient_surveys_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patients patients_corporate_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_corporate_client_id_fkey FOREIGN KEY (corporate_client_id) REFERENCES public.corporate_clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patients patients_insurance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_insurance_id_fkey FOREIGN KEY (insurance_id) REFERENCES public.hmo(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_primary_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_primary_doctor_id_fkey FOREIGN KEY (primary_doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patients patients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescription_items prescription_items_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescription_items
    ADD CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: survey_answers survey_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_answers
    ADD CONSTRAINT survey_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.survey_questions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: survey_answers survey_answers_response_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_answers
    ADD CONSTRAINT survey_answers_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.survey_responses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_questions survey_questions_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: survey_responses survey_responses_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: survey_responses survey_responses_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surveys surveys_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: surveys surveys_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict yogWyg2DdrjJVnFVyXqVjB4GeFRDppEMwYffTP6nRQTiV8FM0b1PCmlpga2fktT

