You are building a complete HMO Billing + Claims Management module inside my existing EMR (Next.js + PostgreSQL + Prisma + Paystack). This system must match EXACT real-world Nigerian hospital workflows. Build the entire implementation with backend, frontend, database schema, hooks, components, role-based logic, and API routes.
________________________________________
🎯 FEATURE SET OVERVIEW (Non-negotiable)
You must build the system using these models and workflows:
1. Centralized Claim Data Model
Build a universal claim/encounter structure to support all Nigerian HMOs.
Include fields for:
•	Patient data (name, HMO_ID, plan, employer, card number)
•	Provider data (hospital info, provider code)
•	Visit data (visit ID, admission/discharge dates, encounter type)
•	Diagnosis (primary + secondary ICD-10 codes)
•	Procedures (CPT or local codes)
•	Billing items (service ID, unit cost, quantity, total)
•	Authorization code (if HMO requires pre-auth)
•	Co-payment & patient paid amount
•	Attachments (lab results, imaging, prescriptions)
•	Claim status: pending, batching, submitted, paid, partially paid, queried, denied
This is the master structure from which all HMO exports will be generated.
________________________________________
🏦 2. Cashier Dashboard (Billing + HMO Handling)
Create a dedicated dashboard for Cashiers with:
Billing Logic
•	Look up patient
•	Detect patient’s HMO
•	Fetch HMO coverage rules
•	Determine covered vs non-covered services
•	Apply co-pay
•	Auto-detect uncovered services
•	Add authorization code if required
•	Generate bill breakdown
•	Store bill in centralized claim model
Paystack Auto-Charge Logic
•	First payment stores authorization_code
•	For uncovered services or partial cover:
→ automatically trigger charge_authorization Paystack API
•	Consent checkbox required
•	Store authorization code in patient table
Send to Claims Department
After cashier finalizes the encounter, status becomes:
status: “ready_for_claims”
________________________________________
🧑‍💼 3. Claims Officer Dashboard (Claim Submission + Exports)
Build a separate dashboard for accounts/claims team:
Dashboard Functions
•	View all encounters marked “ready_for_claims”
•	Filter by HMO, date, employer
•	Select items to batch
•	Generate batch number
•	Attach all required documents
•	Preview claim format
•	Export:
o	PDF claim sheets (AXA, Hygeia, Redcare)
o	Excel formats (Reliance, Heirs, NHIS, AXA)
o	CSV formats
•	Save submission to Claim Log
Claim Log
Record:
•	HMO
•	Batch number
•	Total amount
•	Date submitted
•	File exported
•	Submission notes
•	Status: Submitted / Processing / Paid / Partially Paid / Denied / Query
Query Management
Claims officer can:
•	Open submitted claim
•	View the error
•	Edit centralized data model fields
•	Regenerate corrected claim
•	Re-submit
________________________________________
🔄 4. Flexible Output Engine (The Most Important Component)
Build a full system that maps the universal data model to each HMO’s custom format.
A. HMO Profile Configuration
Admin should define:
•	HMO name
•	Submission method (Email PDF, Portal Upload Excel, API in future)
•	Required template (PDF, Excel, CSV)
•	Required field mappings
•	Mandatory data (authorization code, ICD-10, employer code, etc.)
•	Fee schedule
•	Coding standards
B. Template Mapping System
Create a UI where admin can map:
EMR Field → HMO Field
procedure_code → Service_ID
diagnosis_icd10 → DiagnosisCode
total_amount → ClaimedAmount
Store mapping JSON per HMO.
C. Template Engine
When exporting a claim batch:
•	Load HMO mapping
•	Convert universal data into correct format
•	Generate PDF/Excel/CSV using appropriate libraries
•	Attach documents
•	Save generated file in storage (Backblaze B2)
________________________________________
🔐 5. Roles & Permissions
Define strictly:
Cashier
•	Add bills
•	Apply HMO logic
•	Save encounters
•	Cannot submit claims
•	Cannot edit claim exports
Claims Officer
•	View “ready_for_claims” encounters
•	Batch claims
•	Generate exports
•	Submit claims
•	Manage queries
•	Update status
Admin
•	Configure HMOs
•	Configure mapping templates
•	Manage fee schedules
•	View all dashboards
________________________________________
📦 7. Deliverables Required
Produce the following:
A. Database Schema (Prisma)
Tables:
•	Patient
•	HMO
•	HMOPlan
•	HMOFieldMapping
•	Encounter
•	Diagnosis
•	Procedure
•	BillingItem
•	ClaimBatch
•	ClaimSubmission
•	Attachments
•	User (roles: cashier, claims_officer, admin)
B. API Routes / Server Actions
•	createEncounter
•	applyHMOCoverage
•	chargeAuthorization
•	saveClaimBatch
•	generateHMOExport
•	uploadAttachments
•	updateClaimStatus
C. UI Components
•	Cashier billing screen
•	HMO coverage display
•	Co-pay calculator
•	Auto-charge confirmation
•	Claims batch creation modal
•	HMO mapping editor UI
•	Claim log table
•	Status tracker
•	PDF/Excel preview
D. Utility Modules
•	HMO rules engine
•	Fee schedule loader
•	Field mapping transformer
•	Excel generator
•	PDF generator
•	Storage adapter for B2
•	Paystack client
E. Full End-to-End Workflows
•	Cashier → Encounter → Ready for Claims
•	Claims → Batch → Export → Submit
•	Query → Correction → Re-submit
Build everything cleanly and systematically.
________________________________________
🚀 Final Output Goal
Produce the full implemented system, not pseudo-code.
Include all code files, endpoints, schemas, UI pages, hooks, components, and configurations.

