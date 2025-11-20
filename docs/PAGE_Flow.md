# Full EMR Design Specification (Hi-Fi Ready) – Finetuned

---

## 🔑 **1. Authentication & Onboarding**

### 1.1 Login Page

**Description:**

* Hospital-branded login screen with logo, name, and primary hospital colors applied
* Fields: Email, Password
* Buttons: Login, "Forgot Password?"
* Register Hospital:
  * Visible only to Momentum (Super Admin) in a separate admin portal
* Security:
  * Consider 2-Factor Authentication (2FA) via email/SMS/Authenticator App for users with high privileges (Hospital Admin, Doctor, Pharmacist)

**Flow:**

* Successful login → Redirect to role-specific dashboard
* Inactive user → Show error with "Contact Hospital Admin" link
* Failed login attempts → lockout after X tries (configurable)

---

### 1.2 Hospital Registration Page (Momentum Only)

**Description:**

* Exclusive for Momentum staff to onboard new hospitals
* Form fields: Hospital Name, Address, Contact Email, Phone Number, Subscription Plan
* Create Initial Admin Account: Name, Email, Password
* Payment section (optional)

**Flow:**

* Creates hospital + admin user
* Redirects to Dashboard Setup Wizard (departments, roles, subscription)

---

### 1.3 Forgot / Reset Password

**Description:**

* Email input → "Send Reset Link"
* Reset Page: New Password, Confirm Password
* Option: Enforce 2FA validation before final reset
**Flow:**

* Email sent → Click link → Set new password → Redirect to login

---
## 🏠 **2. Role-Based Dashboards**

Each dashboard uses a **consistent layout** (header, sidebar, main content), but with **different widgets**.

---

### 2.1 Momentum (Super Admin) Dashboard

* **KPIs:** Total hospitals, Active subscriptions, Pending payments
* **Business Analytics:**
  * Patient type breakdown (HMO vs corporate Clients vs Out-of-pocket)
  * Drug usage classification (aggregated)
  * Types of investigations & surgeries (aggregate counts)
  * Diagnosis distribution (no PII)
  * Patient age group distribution (aggregate)
  * Average cost per patient (de-identified)
  * Follow-up visit trends
* **Charts:** Monthly hospital signups, active hospital usage
* **Actions:** Suspend hospitals, Manage subscription plans, View aggregated reports

---

### 2.2 Hospital Admin Dashboard

* **KPIs:** Total patients, Total staff, Today's appointments, Revenue today
* **Analytics:**
  * Patient type breakdown (HMO vs corporate Client vs Out-of-pocket)
  * Drug usage classification
  * Surgeries performed & investigations requested
  * diagnosis frequency
  * Cost per patient
  * Age demographics
  * Follow-up visit trends per month
* **Widgets:** Inventory low stock alerts, Notifications
* **Charts:** Revenue trends, Patient inflow
* **Actions:** Manage users, Departments, Subscription configuration

---

### 2.3 Doctor Dashboard

* **KPIs:** Today's appointments, Pending lab results, Follow-ups due
* **Widgets:**
  * Upcoming appointments list (sortable by time)
  * Lab result notifications
  * Pharmacy inventory widget (stock levels and alerts)
* **Actions:** Open patient file, Create prescription, Request lab order

---

### 2.4 Nurse Dashboard

* **KPIs:** Patients in ward, Bed occupancy rate, Outstanding tasks
* **Widgets:**
  * Vital signs at a glance (recent measurements)
  * Pending lab results count
  * Medication administration record summary
  * Pending treatment tasks (wound care, blood draws, radiology requests)
  * Discharge & transfer status list
* **Actions:** Record vitals, Update care tasks, Mark patient as discharged/transferred

---

### 2.5 Pharmacist Dashboard

* **KPIs:** Pending prescriptions, Stock alerts
* **Widgets:** Drug inventory table, Prescription queue
* **Analytics:** Total prescriptions classified by drug type/category
* **Actions:** Dispense medication, Update stock, Generate reorder requests

---

### 2.6 Cashier Dashboard

* **KPIs:** Today's revenue, Pending invoices
* **Widgets:** Invoice list with filters
* **Actions:** Receive payments (POS, cash, HMO), Print receipts, Refund

---

### 2.7 Lab Technician Dashboard

* **KPIs:** Pending lab orders, Completed today
* **Widgets:** Orders list with quick actions (mark in-progress, completed)
* **Actions:** Upload results (PDF, DICOM), Enter values, Flag critical results

---

### 2.8 Patient Dashboard (Portal)

* **Widgets:** Next appointment, Recent lab results, Billing summary
* **Actions:** Book appointment, Download results, Pay bills, Fill survey

## 📋 **3. Core Modules & Pages**

All lists and dashboards must filter based on hospital & user role.

---

### 3.1 Patients Module

* **List Page:** Table of patients (name, ID, DOB, gender, contact)
  * Filters: Name search, Gender, Age range
* **Details Page:** Tabs: Overview, Medical Records, Appointments, Billing, Lab Results
* **Actions:** Edit patient info, View emergency contact, Add note

**Flow:**
Clicking a patient from list → opens details page → user can navigate tabs.

---

### 3.2 Appointments Module

* **Calendar View:** Monthly/Weekly/Day view with appointment slots
* **List View:** Sortable table of appointments
* **Create Appointment:** Patient select (autocomplete), Doctor select, Date/Time picker, Appointment type

**Flow:**
Booking an appointment → triggers notification to doctor & patient.

---

### 3.3 Medical Records

* **List by Patient:** All visits, diagnosis, notes
* **Record View:** Details, attachments (images, PDFs)
* **Actions:** Add new record, Upload file

---

### 3.4 Prescriptions & Pharmacy

* **Prescription List:** Filter by patient, doctor, status
* **Prescription Detail:** Items (drug, dosage, frequency)
* **Actions:** Mark as dispensed, Edit items, Print prescription

---

### 3.5 Inventory

* **Table:** Item name, stock quantity, reorder level, expiry date
* **Actions:** Add item, Adjust stock, View low-stock alerts
* **Flow:** Alerts should trigger notifications when stock < reorder level.

---

### 3.6 Billing & Invoices

* **Invoices Page:** List of invoices with status filter
* **Invoice Detail:** Patient info, amount, payment status, linked HMO
* **Actions:** Add payment, Refund, Generate receipt (PDF)

---

### 3.7 Lab Orders & Results

* **Orders Page:** List with status (pending, in progress, completed)
* **Order Detail:** Patient, ordered tests, doctor’s notes
* **Result Page:** Upload result file, enter lab values, mark as finalized

---

### 3.8 Notifications Center

* **List View:** Filter by type (lab result, payment, appointment)
* **Detail View:** Message, timestamp, action buttons (e.g., view result)

---

### 3.9 Analytics Dashboards & Reports

* **Dashboards:** Configurable widgets (charts, KPIs)
* **Reports:** Generate PDF/Excel, filter by date range, download

---

### 3.10 Patient Surveys

* **Form:** Rating scale, open feedback
* **Analytics:** Aggregate scores, feedback word cloud

---

## 🧭 **4. Navigation & Layout**

* **Global Header:** Logo, search bar, notification bell, user profile dropdown
* **Sidebar:** Role-based menu (Momentum sees all hospitals, others see only their hospital)
* **Responsive Layout:** Mobile-first, collapsible sidebar

---

## 🔒 **5. Security & Compliance**

* **Role-Based Access Control (RBAC)** across all modules
* **Audit Logs** for sensitive actions (e.g., prescriptions, discharge, billing)
* **2FA** for critical users (Momentum, Hospital Admins, Doctors)
* **PHI Handling:** Patient data anonymization in Momentum-level dashboards

---