

# Design & Build Brief — Multi-Tenant EHR (uses provided DBML schema)

**Summary (one sentence)**
Design a production-ready, accessible, high-fidelity web UI (desktop-first, responsive to tablet) for a multi-tenant EHR platform. The UI must map directly to the supplied DBML schema and support these roles: `admin`, `doctor`, `nurse`, `pharmacist`, `cashier`, `patient`, `lab tech`. The implementation stack will be **Next.js (frontend)**, **NestJS (backend)**, **PostgreSQL (Prisma ORM)**, with file storage on S3/R2 and real-time via WebSockets/Redis.

---

## Tech stack & recommended improvements (must be used/recommended)

* Frontend: **Next.js + TypeScript**, React Query (TanStack), TailwindCSS (or Tailwind + component library). Use SSR for summary pages and client components for interactive flows.
* Backend: **NestJS (TypeScript)** for modular, maintainable APIs (controllers, services, modules, DTOs).
* Database: **PostgreSQL** (single DB, multi-tenant), **Prisma** ORM for schema, migrations, and type-safe queries.
* Auth & Security: **NextAuth.js** or **Clerk/Auth0** for authentication; implement RBAC and JWT session checks; enforce middleware that injects/validates `hospital_id`.
* File storage: **S3-compatible** (AWS S3 or Cloudflare R2). Use pre-signed upload URLs and a DICOM pipeline for imaging.
* Real-time & Background: **Redis** + **BullMQ** for background jobs; WebSockets or Socket.IO via NestJS Gateway for queues & notifications.
* Notifications: Twilio / Africa’s Talking for SMS, FCM for push, SendGrid/SES/Resend for email.
* Payments: Paystack / Flutterwave (webhooks secured & verified).
* Observability: Sentry (errors), Prometheus/Grafana or Datadog (metrics).
* Compliance: Row-level security (RLS) in Postgres, audit logs table, encryption for PII, TLS for all traffic.

---

## Color tokens & design tokens (use exactly)

CSS variables (copy into project):

```css
:root{
  --amaranth: #e7265e;
  --red-ribbon: #eb0146;
  --green-haze: #08b358;
  --tory-blue: #1253b2; /* primary */
  --saffron: #f8be29;
  --spindle: #c7d7ed;
  --danube: #729ad2;
  --froly: #f57da0;
  --padua: #b0e7c9;
}
```

Primary color: **Tory Blue (#1253b2)** — used for top nav, primary CTA, active states.

Typography: Inter or Roboto (H1 24px, H2 20px, body 14–16px). Spacing: 8px grid.

---

## Deliverables (designer)

1. Figma file with: Design System page (tokens, components), Pages folder (hi-fi screens for all listed pages), Components & Variants (atoms → organisms).
2. Clickable prototype for core flows.
3. Export tokens: CSS vars, Tailwind config snippet.
4. Handoff spec for devs: component props, accessibility notes, example API contracts, placeholders for images (avatars, hospital logo, DICOM viewer frame).
5. Optional: HTML/CSS snippets for key components (nav, patient card, table).

---

## Pages & mapping to DB schema (detailed)

For each page below I list: requirement, purpose, components, DB fields used, example API endpoints, and design notes.

General UI skeleton for every page: top nav with hospital name + quick actions + user avatar, collapsible left nav, content area with breadcrumb and page title.

---

### 1. Authentication & Onboarding

* Requirement: secure login for staff & onboarding for hospitals.
* Purpose: authenticate users, route to role-specific dashboards.
* Components: Login form, Forgot password modal, onboarding wizard (super-admin), SSO buttons.
* DB fields: `users.email`, `users.role`, `users.hospital_id`, `users.last_login`.
* API examples:

  * `POST /auth/login` {email, password}
  * `POST /auth/forgot` {email}
* Design: Tory Blue primary button, error in Red Ribbon, simple hospital selector for onboarding.

---

### 2. Super-admin: Hospitals Management

* Requirement: manage tenants.
* Purpose: onboard hospitals, update subscriptions.
* Components: Hospitals table, Add/Edit modal, search & filters, status toggle.
* DB fields: `hospitals.*`
* API examples:

  * `GET /admin/hospitals`
  * `POST /admin/hospitals`
  * `PUT /admin/hospitals/:id`
* Design: table rows with Spindle alternation, Active badge: Green Haze.

---

### 3. User & Role Management

* Requirement: manage staff accounts and roles.
* Purpose: ensure correct RBAC.
* Components: Staff list (filter by role), Add/Edit user modal, invite flow.
* DB fields: `users.*`
* API examples:

  * `GET /h/:hid/users`
  * `POST /h/:hid/users`
  * `PUT /h/:hid/users/:id`
* Design: role pills (Doctor: Tory Blue, Nurse: Danube, Pharmacist: Padua).

---

### 4. Patient List & Registration

* Requirement: search, create, and update patient records.
* Purpose: register patients and enable retrieval.
* Components: Search bar, table/list, Add Patient form (multi-step optionally).
* DB fields: `patients.*` (`insurance_id` links to `hmo.id`)
* API examples:

  * `GET /h/:hid/patients?q=...`
  * `POST /h/:hid/patients`
  * `GET /h/:hid/patients/:id`
* Design: patient cards or rows with avatar placeholder, action buttons (view, edit).

---

### 5. Patient Profile (Tabbed)

* Requirement: single hub for patient clinical & admin data.
* Purpose: give clinicians one-screen access to everything for a patient.
* Components & tabs:

  * Summary (demographics: `patients.*`)
  * Appointments (`appointments.*`)
  * Medical Records (`medical_records.*`)
  * Lab Results (`lab_orders.*`, `lab_results.*`, `lab_result_values.*`)
  * Prescriptions (`prescriptions.*`, `prescription_items.*`)
  * Billing (`invoices.*`, `payments.*`)
  * Surveys (`patient_surveys.*`)
* API:

  * `GET /h/:hid/patients/:pid/summary`
  * `GET /h/:hid/patients/:pid/appointments`
  * `GET /h/:hid/patients/:pid/records`
* Design: Saffron underline for active tab; quick action buttons (New Appointment, New Encounter).

---

### 6. Appointments & Queue

* Requirement: book and manage appointments, run a live queue.
* Purpose: scheduling, reduce wait times and manage theatre/IPD flows.
* Components: Calendar (day/week/month), Queue list for check-ins, appointment modal.
* DB fields: `appointments.*`
* API & realtime:

  * `GET /h/:hid/appointments?date=...`
  * `POST /h/:hid/appointments`
  * WebSocket events: `appointment.created`, `appointment.updated`, `queue.change`
* Design: color-coded appointment types; queue cards with call/check-in actions.

---

### 7. Medical Records / Encounters

* Requirement: record clinical encounters and attach files.
* Purpose: build an audit trail of clinical activity.
* Components: Encounter form, upload attachments, timeline view.
* DB fields: `medical_records.*` (attachments JSONB)
* API:

  * `POST /h/:hid/patients/:pid/encounters` (body contains diagnosis, notes, attachments links)
  * `GET /h/:hid/patients/:pid/encounters`
* Design: timeline with blue connectors, dashed upload dropzone in Danube.

---

### 8. Lab Orders & Results (Imaging + Pathology)

* Requirement: order tests, upload & view results (DICOM/PDF).
* Purpose: structured lab workflows and searchable results.
* Components: Lab Orders dashboard, New Order modal, Results upload flow, Results viewer (image/PDF + structured numeric table).
* DB fields: `lab_orders.*`, `lab_results.*`, `lab_result_values.*`
* API (recommended signed upload flow):

  * `POST /h/:hid/lab_orders` → create order
  * `GET /h/:hid/lab_orders?status=...`
  * `POST /h/:hid/lab_orders/:orderId/results/prepare` → returns signed URL + result id
  * `PUT` file to signed URL
  * `POST /h/:hid/lab_orders/:orderId/results/complete`
* Design: Green Haze border for completed, finalize/approve flow for doctors, DICOM viewer frame placeholder.

---

### 9. Prescriptions & Treatment Plans

* Requirement: create, reuse, and track prescriptions.
* Purpose: ensure correct medication orders and pharmacy handoff.
* Components: Prescription builder, template library, prescription items table.
* DB fields: `prescriptions.*`, `prescription_items.*`
* API:

  * `POST /h/:hid/patients/:pid/prescriptions`
  * `GET /h/:hid/prescriptions/:id`
* Design: medication pills, quick link to pharmacy dispense.

---

### 10. Pharmacy & Inventory

* Requirement: manage stock, expiry, reorders; dispensing tied to prescriptions.
* Purpose: prevent stockouts and track medication flow.
* Components: Inventory table, Add stock modal, Dispense modal.
* DB fields: `inventory.*` (stock_quantity, expiry_date)
* API:

  * `GET /h/:hid/inventory`
  * `POST /h/:hid/inventory`
  * `POST /h/:hid/inventory/:id/dispense`
* Design: low-stock rows highlighted in Froly; reorder alert badges.

---

### 11. Billing, Invoices & Payments (HMO integration)

* Requirement: build invoices, map HMO coverage, capture payments.
* Purpose: revenue collection and HMO claims handling.
* Components: Invoice builder, HMO selector (`hmo.*`), Payment modal (gateway integration), webhook handlers.
* DB fields: `invoices.*`, `payments.*`, `hmo.*`
* API:

  * `POST /h/:hid/invoices`
  * `POST /webhook/payments` (verify signature)
  * `GET /h/:hid/invoices/:id`
* Design: invoice status badges (Paid: Green Haze, Pending: Saffron, Cancelled: Froly). Export PDF option.

---

### 12. Notifications & Surveys

* Requirement: centralized notifications and patient feedback collection.
* Purpose: reminders, alerts, and satisfaction metrics.
* Components: Notification center, send-notification modal, survey writer & analytics.
* DB fields: `notifications.*`, `patient_surveys.*`
* API:

  * `GET /h/:hid/notifications`
  * `POST /h/:hid/notifications`
  * `POST /h/:hid/patient_surveys`
* Design: notification dropdown + full page center; survey results as charts.

---

### 13. Analytics — Dashboards, Reports & Metrics

* Requirement: configurable dashboards and scheduled reports.
* Purpose: operational & financial insights per hospital.
* Components:

  * Analytics Dashboards page (`analytics_dashboards.*`) — create, configure widgets, switch dashboards.
  * Reports page (`analytics_reports.*`) — generate and download CSV/PDF.
  * Metrics table (`analytics_metrics.*`) — date-based metrics feeds.
* DB fields: `analytics_dashboards.*`, `analytics_reports.*`, `analytics_metrics.*`
* API:

  * `GET /h/:hid/analytics/dashboards`
  * `POST /h/:hid/analytics/reports/generate` → returns `analytics_reports` record with `status` and `file_url`
  * `GET /h/:hid/analytics/metrics?from=...&to=...`
* Design: KPI cards (patients, revenue), charts in Tory Blue + Green Haze, configurable widget grid, export buttons.

---

## Example API contracts (selected — match schema)

**Create patient**

```
POST /h/:hid/patients
Body:
{
  "first_name":"Jane",
  "last_name":"Doe",
  "dob":"1985-05-01",
  "gender":"female",
  "contact_info": {"phone":"+234...", "email":"jane@example.com"},
  "address":"...",
  "emergency_contact":"...",
  "insurance_id": 12
}
```

**Schedule appointment**

```
POST /h/:hid/appointments
{
  "patient_id": 123,
  "doctor_id": 45,
  "department": "Cardiology",
  "appointment_type": "OPD",
  "start_time": "2025-10-20T09:30:00Z",
  "end_time": "2025-10-20T09:50:00Z"
}
```

**Generate analytics report**

```
POST /h/:hid/analytics/reports
{
  "report_type": "monthly_patient_volume",
  "report_period_start": "2025-09-01",
  "report_period_end": "2025-09-30",
  "generated_by": 5
}
Response: 202 Accepted { "id": 432, "status": "generating" }
```

**Upload lab result (recommended flow)**

1. `POST /h/:hid/lab_orders/:orderId/results/prepare` → returns `{ result_id, upload_url }`.
2. Client `PUT` file to upload_url.
3. `POST /h/:hid/lab_orders/:orderId/results/complete` → `{ result_id, file_url, result_notes, lab_result_values: [...] }`.

---

## Data access & security patterns (must be enforced)

* Multi-tenant: `hospital_id` required for tenant-scoped endpoints. Middleware verifies session hospital.
* Row-Level Security (RLS): use `current_setting('app.hospital')` approach or JWT claims to guard rows.
* RBAC: UI hides actions by role; backend enforces role checks for each endpoint.
* Audit log table (recommended): capture `{ actor_user_id, action, table, record_id, before, after, created_at }`.
* Encryption: PII encrypted (at rest/app-level if required). Signed URLs for file access; DICOM files stored with restricted access.
* Backups: nightly DB snapshots and file storage backups.

---

## Implementation & developer guidelines (monorepo + patterns)

* Monorepo: Turborepo / Nx

  * `/apps/web` — Next.js (frontend)
  * `/apps/api` — NestJS (backend)
  * `/packages/ui` — shared React/Tailwind components
  * `/prisma` — Prisma schema & migrations
* Prisma: generate schema from DBML (fields with JSONB map to `Json`), add `@@index` on frequently queried columns (hospital_id, patient_id).
* Testing: Jest for unit, Supertest for API integration, Playwright/Cypress for E2E.
* CI/CD: GitHub Actions — lint, test, prisma migrate, deploy.
* Real-time: NestJS Gateway with Socket.IO; broadcast `appointment` and `notification` events to hospital room.
* File uploads: pre-signed URLs; validate & scan uploads; generate thumbnails for DICOM.

---

## Component library & states (must include)

* Buttons: primary (Tory Blue), secondary, ghost, destructive, loading state.
* Inputs: text, textarea, select, multi-select, date/time picker, masked phone input.
* Tables: sortable, filterable, paginated, row actions.
* Modals & slide-overs: add/edit forms (accessible).
* Badges & chips: status badges (appointment/invoice).
* Toasts: success (Green Haze), error (Red Ribbon).
* Avatars, icons (Lucide), charts (Recharts or Chart.js).

---

## Acceptance criteria (QA)

* Figma file contains all pages above with hi-fi designs and prototype linking core flows: register → schedule → encounter → order lab → upload result → invoice → pay.
* Component library exported with tokens and Tailwind config snippet.
* Prototype demonstrates responsive behavior for desktop and tablet breakpoints.
* Accessibility: WCAG AA contrast for text, keyboard navigation for forms.
* Handoff: designer delivers component props, sample API contracts, and placeholder assets.

---

## Ready-to-paste prompt (for the designer or Figma AI)

Use this paragraph for direct paste:

> Design a production-ready, high-fidelity UI for a multi-tenant EHR platform (desktop-first, responsive to tablet) that implements the attached DBML schema. Use Tory Blue `#1253b2` as the primary color and the provided color tokens. Build Hi-Fi screens for: authentication, hospital management, user management, patient registration & profile (tabs: summary, appointments, medical records, lab results, prescriptions, billing, surveys), appointment calendar & queue, encounter/medical records, lab orders & results (DICOM viewer frame), prescription builder, pharmacy inventory & dispense flow, billing & payments (HMO support), notifications & survey collection, and analytics dashboards & reports. Provide a full Figma design system: tokens, components with variants (buttons, inputs, tables, modals), clickable prototype, exportable CSS vars/Tailwind tokens, and a dev handoff spec containing component props and example API contracts. Enforce accessibility (WCAG AA), and include placeholders for images (avatars, hospital logo), DICOM viewer frame, and charts. Use the attached DBML schema to map UI fields and API endpoints.

Attach the DBML schema file (the one you provided).

