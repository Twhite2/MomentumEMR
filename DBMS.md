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
