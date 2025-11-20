✅ Exactly — what you just described **does make it closer to an EHR** rather than a pure EMR.

* **EMR** = electronic medical record inside *one hospital*.
* **EHR** = electronic health record that can span multiple hospitals/clinics under one platform, with shared data and (optionally) interoperability.

So yes, if **your company is providing a single service that multiple hospitals can subscribe to**, you’re effectively building a **multi-tenant EHR platform**.
That impacts your **database schema** — you need to isolate data per hospital (tenant) and ensure security + scalability.

---

## 🗄️ Recommended Database Schema (High-Level)

Here’s a **normalized relational schema** you can use with **PostgreSQL**.
I’m showing the **main tables + relationships** — you can expand as needed.

---

### 1️⃣ **Tenant / Organization Management**

Each hospital, clinic, or facility is a tenant.

| Table: `hospitals`         |
| -------------------------- |
| `id` (PK)                  |
| `name`                     |
| `address`                  |
| `contact_email`            |
| `phone_number`             |
| `subscription_plan`        |
| `active` (bool)            |
| `created_at`, `updated_at` |

---

### 2️⃣ **User & Role Management**

You need **multi-level access control**: admin, doctor, nurse, pharmacist, cashier, etc.

| Table: `users`                                                    |
| ----------------------------------------------------------------- |
| `id` (PK)                                                         |
| `hospital_id` (FK → hospitals.id)                                 |
| `name`                                                            |
| `email`                                                           |
| `hashed_password`                                                 |
| `role` (ENUM: admin, doctor, nurse, pharmacist, cashier, patient) |
| `active` (bool)                                                   |
| `last_login`                                                      |
| `created_at`, `updated_at`                                        |

---

### 3️⃣ **Patients**

Each patient belongs to a hospital but may visit multiple hospitals (optional cross-hospital support).

| Table: `patients`                           |
| ------------------------------------------- |
| `id` (PK)                                   |
| `hospital_id` (FK)                          |
| `first_name`, `last_name`                   |
| `dob`                                       |
| `gender`                                    |
| `contact_info` (JSONB)                      |
| `address`                                   |
| `emergency_contact`                         |
| `insurance_id` (FK → insurance_policies.id) |
| `created_at`, `updated_at`                  |

---

### 4️⃣ **Appointments & Queue**

Supports scheduling for OPD, IPD, specialists.

| Table: `appointments`                                        |
| ------------------------------------------------------------ |
| `id` (PK)                                                    |
| `hospital_id` (FK)                                           |
| `patient_id` (FK)                                            |
| `doctor_id` (FK → users.id)                                  |
| `department`                                                 |
| `appointment_type` (ENUM: OPD, IPD, surgery, lab, follow-up) |
| `status` (ENUM: scheduled, checked-in, completed, cancelled) |
| `start_time`, `end_time`                                     |
| `created_at`, `updated_at`                                   |

---

### 5️⃣ **Medical Records**

Structured storage of encounters & history.

| Table: `medical_records`                                   |
| ---------------------------------------------------------- |
| `id` (PK)                                                  |
| `hospital_id` (FK)                                         |
| `patient_id` (FK)                                          |
| `doctor_id` (FK)                                           |
| `visit_date`                                               |
| `diagnosis` (TEXT)                                         |
| `notes` (TEXT)                                             |
| `attachments` (JSONB: links to scans, x-rays, lab reports) |
| `created_at`, `updated_at`                                 |

---

### 6️⃣ **Prescriptions & Treatment Plans**

| Table: `prescriptions`                           |
| ------------------------------------------------ |
| `id` (PK)                                        |
| `hospital_id` (FK)                               |
| `patient_id` (FK)                                |
| `doctor_id` (FK)                                 |
| `treatment_plan` (TEXT / JSONB for complex data) |
| `status` (active, completed)                     |
| `created_at`, `updated_at`                       |

| Table: `prescription_items` |
| --------------------------- |
| `id` (PK)                   |
| `prescription_id` (FK)      |
| `drug_name`                 |
| `dosage`                    |
| `frequency`                 |
| `duration`                  |
| `notes`                     |

---

### 7️⃣ **Pharmacy / Inventory**

| Table: `inventory` |
| ------------------ |
| `id` (PK)          |
| `hospital_id` (FK) |
| `item_name`        |
| `item_code`        |
| `stock_quantity`   |
| `reorder_level`    |
| `unit_price`       |
| `expiry_date`      |

---

### 8️⃣ **Billing & Payments**

| Table: `invoices`                             |
| --------------------------------------------- |
| `id` (PK)                                     |
| `hospital_id` (FK)                            |
| `patient_id` (FK)                             |
| `total_amount`                                |
| `status` (pending, paid, cancelled, refunded) |
| `payment_method`                              |
| `hmo_id` (optional)                           |
| `created_at`, `updated_at`                    |

| Table: `payments`                               |
| ----------------------------------------------- |
| `id` (PK)                                       |
| `invoice_id` (FK)                               |
| `amount_paid`                                   |
| `payment_date`                                  |
| `payment_gateway` (Paystack, Flutterwave, etc.) |
| `transaction_ref`                               |

---

### 9️⃣ **Notifications & Surveys**

| Table: `notifications`           |
| -------------------------------- |
| `id` (PK)                        |
| `hospital_id` (FK)               |
| `user_id` (FK)                   |
| `type` (email, sms, push)        |
| `message`                        |
| `status` (pending, sent, failed) |

| Table: `patient_surveys` |
| ------------------------ |
| `id` (PK)                |
| `hospital_id` (FK)       |
| `patient_id` (FK)        |
| `survey_data` (JSONB)    |
| `submitted_at`           |

---

### 🔑 Multi-Tenant Strategy

Since multiple hospitals use the system:

* **Always include `hospital_id` as a foreign key** in all tables.
* Add **row-level security (RLS)** in PostgreSQL to ensure users can only query rows belonging to their hospital.
* Consider a **"super admin" dashboard** (for your company) to see analytics across hospitals, but with strict data compliance.

---

### 🔒 Security Considerations

* Encrypt sensitive fields (PII, insurance numbers).
* Audit logging table (every change should be tracked).
* Strict access control: RBAC and possibly ABAC (attribute-based access control) for fine-grained permissions.
* GDPR/HIPAA-like compliance — especially if storing lab results, scans.

---

## 👨‍⚕️ Doctor Role Permissions (Complete List)

### ✅ Editor Access (Create, Read, Update)

| # | Feature | API Endpoint | Status |
|---|---------|--------------|--------|
| 1 | **Patient Medical Records** | `/api/medical-records` | ✅ Full Editor Access |
| 2 | **Prescriptions** | `/api/prescriptions` | ✅ Full Editor Access |
| 3 | **Lab Orders (Order Lab Test)** | `/api/lab-orders` | ✅ Full Editor Access |
| 4 | **Lab Results** | `/api/lab-results` | ✅ View & Edit |
| 5 | **Appointments** | `/api/appointments` | ✅ Full Editor Access |
| 6 | **Vitals Input** | Part of Medical Records | ✅ Via Medical Records |
| 7 | **Admission & Discharge** | Part of Appointments | ✅ Via Appointments |

### 📖 View-Only Access (Read Only)

| # | Feature | API Endpoint | Status |
|---|---------|--------------|--------|
| 1 | **Patient Queue (Check-in/out)** | `/api/appointments` | ✅ View via Appointments |
| 2 | **Pharmacy Inventory** | `/api/inventory` | ✅ View Access (Fixed) |
| 3 | **Dashboard & Analytics** | `/analytics` | ✅ Full View Access |
| 4 | **Patients List** | `/api/patients` | ✅ View Access |

### 🔍 Detailed Permission Breakdown

#### 1. Medical Records (`/api/medical-records`)
- **GET**: ✅ View their own patients' records
- **POST**: ✅ Create new medical records
- **PUT**: ✅ Update medical records
- Includes: Diagnosis, Notes, Attachments, Vitals

#### 2. Prescriptions (`/api/prescriptions`)
- **GET**: ✅ View their own prescriptions
- **POST**: ✅ Create new prescriptions with medications
- **PUT**: ✅ Update prescription status
- **DELETE**: ✅ Cancel prescriptions

#### 3. Lab Orders (`/api/lab-orders`)
- **GET**: ✅ View their own lab orders
- **POST**: ✅ Order new lab tests (X-ray, CT, MRI, Ultrasound, Pathology)
- **PUT**: ✅ Update lab order details
- Assigns to lab technicians automatically

#### 4. Lab Results (`/api/lab-results`)
- **GET**: ✅ View all lab results for their patients
- Can view finalized and pending results
- Can add doctor notes to results
- Cannot upload/release results (lab tech only)

#### 5. Appointments (`/api/appointments`)
- **GET**: ✅ View their own appointments
- **POST**: ✅ Create new appointments
- **PUT**: ✅ Update appointment status (check-in, complete, cancel)
- Handles patient queue via status updates

#### 6. Patients (`/api/patients`)
- **GET**: ✅ View their assigned patients by default
- **GET** with `showAll=true`: ✅ View all hospital patients
- Cannot create/edit/delete patients (admin only)

#### 7. Pharmacy Inventory (`/api/inventory`) **[NEWLY ADDED]**
- **GET**: ✅ View inventory list (search, filter by low stock, expiry)
- **GET** individual item: ✅ View item details
- ❌ Cannot create/update/delete inventory items (pharmacist/admin only)

#### 8. Dashboard & Analytics (`/analytics`)
- **GET**: ✅ View analytics dashboards
- **GET**: ✅ View reports (appointments, patients, consultations)
- Types: Patient volume, Revenue, Drug statistics, Consultation metrics

### 🚫 Restricted Access (Not Allowed)

Doctors **cannot** access:
- User management (creating staff accounts)
- Inventory management (adding/editing drugs)
- Billing/Invoice management (cashier only)
- Survey creation (admin only)
- Hospital settings (admin only)

### 🔐 Data Isolation Rules

Doctors automatically see:
1. **Own patients only** - filtered by `primaryDoctorId` or `doctorId`
2. **Own appointments** - filtered by `doctorId`
3. **Own prescriptions** - filtered by `doctorId`
4. **Own lab orders** - filtered by `orderedBy`
5. Can override with `showAll=true` for patients (requires admin approval)

### 📝 Notes

- **Patient Allergy Summary**: Currently part of Medical Records notes field
- **Vitals Input**: Stored in Medical Records attachments/notes (no separate table yet)
- **Admission/Discharge**: Managed via Appointment status changes
- All permissions enforced via `requireRole(['doctor'])` middleware
