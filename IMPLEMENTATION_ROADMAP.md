# EMR Feature Implementation Roadmap

## ✅ COMPLETED FEATURES

### Database Schema (All Ready)
- [x] Patient queue with emergency priority
- [x] HMO enrollee number field
- [x] Inventory dosage & packaging fields
- [x] Nursing inventory usage tracking
- [x] Lab inventory usage tracking
- [x] Multi-tier pricing (Self-pay, HMO, Corporate)

### Already Implemented
- [x] Patient queue sorting (emergency + check-in time)
- [x] HMO enrollee number in registration
- [x] Lab Scientist labeling (not "Technician")
- [x] Lab finalization before doctor release
- [x] Password visibility toggle
- [x] Vitals mouse wheel bug fix
- [x] Notification dismiss behavior
- [x] Context-aware back buttons
- [x] Pharmacy expiry notifications (90 days)
- [x] Lab result attachments viewing
- [x] Automatic tablet calculation for prescriptions
- [x] Drug name autocomplete from inventory

---

## 🔨 HIGH PRIORITY (Implement Now)

### 1. Admission Status for Pharmacists
**Need:** Pharmacists see if patient is on admission
**Files:**
- Display admission badge on pharmacy queue
- Show in prescription details

### 2. Medical Records Access & Edit History
**Need:** All doctors can view any patient's records + edit history
**Implementation:**
- Remove doctor-specific filtering on medical records API
- Add edit history tracking to medical records
- Show "Edited by Dr. X on Date" indicator

### 3. Nurses & Lab Inventory Usage Interface
**Need:** UI for recording inventory usage
**Files to create:**
- `/apps/web/src/app/(protected)/nursing-supplies/page.tsx` - Record supplies used
- `/apps/web/src/app/(protected)/lab-supplies/page.tsx` - Record lab supplies
- `/apps/web/src/app/api/nursing-inventory-usage/route.ts`
- `/apps/web/src/app/api/lab-inventory-usage/route.ts`

### 4. Time Tracking at Clinical Stages
**Need:** Track patient flow time
**Database changes needed:**
- Add timestamps to appointments:
  - `registeredAt`
  - `nurseStartAt`
  - `nurseEndAt`
  - `doctorStartAt`
  - `doctorEndAt`
  - `labStartAt`
  - `labEndAt`
  - `pharmacyStartAt`
  - `pharmacyEndAt`
  - `cashierStartAt`
  - `cashierEndAt`

### 5. Allergy Calculation on Dashboard
**Clarification needed:** What calculation? Just count patients with allergies?

---

## 📊 MEDIUM PRIORITY

### 6. Excel Export Mirroring
**Need:** All data downloadable in Excel format
**Implementation:**
- Excel generation library (e.g., `exceljs`)
- Export endpoints for each module:
  - Patients
  - Appointments
  - Prescriptions
  - Lab Orders
  - Invoices
  - Inventory

### 7. Super Admin Data Download
**Need:** Download all hospital data
**Implementation:**
- Create super admin endpoint
- ZIP file with all exports
- Include audit logs

### 8. History Clearing (Daily Reset)
**Need clarification:** What history needs clearing daily?
- Patient queue? (auto-clears based on date)
- Notifications?
- Cache?

---

## 🔄 ENHANCEMENT REQUESTS

### 9. Inventory Tablet Counting Logic
**Current:** `tabletsPerPackage` field exists
**Enhancement needed:** UI for pharmacists to track partial packages
**Example:**
- Package = 100 tablets
- Dispensed = 21 tablets
- Remaining in package = 79 tablets

### 10. Inventory Category Access Control
**Need:** 
- Nurses only see "Nursing" category inventory
- Lab scientists only see "Lab" category inventory
**Implementation:** Filter by category in API based on user role

---

## 📝 NOTES & QUESTIONS

1. **Queue History Clearing:** Does this mean removing completed appointments from the queue view daily? (Already happens - query only shows today's appointments)

2. **Allergy Dashboard Calculation:** Please clarify what metric is needed:
   - Total patients with allergies?
   - Most common allergies?
   - Allergy alerts today?

3. **Tablet Counting:** Should we track opened packages separately from sealed packages?

4. **Lab Scientist Label:** Already implemented - appears as "Lab Scientist" in UI

---

## 🚀 NEXT STEPS

1. Implement admission status display
2. Enable cross-doctor medical records access
3. Build inventory usage interfaces
4. Add clinical flow time tracking
5. Create Excel export functionality
