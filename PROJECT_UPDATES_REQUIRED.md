# 📋 MOMENTUM EMR - PROJECT UPDATES REQUIRED

**Document Created**: November 12, 2025  
**Based on**: User Feedback Collection (November 6, 2025)  
**Status**: Action Items Pending Implementation

---

## 🎯 EXECUTIVE SUMMARY

This document outlines all requested updates and fixes based on user testing feedback from multiple roles (Patients, Doctors). Issues are categorized by priority and implementation complexity.

### Quick Stats
- **Total Issues Reported**: 8 unique issues
- **Critical (Blocking)**: 3 issues
- **High Priority**: 3 issues
- **Medium Priority**: 2 issues
- **Already Fixed**: 2 issues ✅

---

## 🚨 CRITICAL ISSUES (Blocking Core Functionality)

### 1. ⛔ Insufficient Permission - Patients Cannot Book Appointments
**Reported by**: Olaide OLAWUWO (Patient), Anonymous (Patient)  
**Status**: 🔴 CRITICAL - Blocks primary patient function  
**Approved Action**: Grant Editors access to Appointment booking for Patients

**Issue Description**:
Patients are getting "insufficient permission" errors when attempting to book appointments with doctors.

**Impact**:
- Patients cannot self-schedule appointments
- Major workflow blocker for patient role
- Affects core functionality of the system

**Required Changes**:
```typescript
// File: apps/web/src/lib/auth.ts or relevant auth/permissions file
// Update role permissions to allow 'patient' role to:
- POST /api/appointments (create appointments)
- GET /api/appointments (view own appointments)
- PUT /api/appointments/:id (reschedule own appointments)
```

**Files to Update**:
- `apps/web/src/lib/auth.ts` - Add patient to appointment creation permissions
- `apps/web/src/app/api/appointments/route.ts` - Update requireRole middleware
- `apps/web/src/app/(protected)/appointments/new/page.tsx` - Verify UI permissions

---

### 2. ⛔ Insufficient Permission - Doctors Cannot Book Follow-up Appointments
**Reported by**: Hope Adeyi (Doctor), Odey Eneyi (Doctor), Glorious Kate Akpegah (Doctor)  
**Status**: 🔴 CRITICAL - Blocks clinical workflow  
**Approved Action**: Grant Editors access to Appointment booking for Doctors

**Issue Description**:
Doctors are unable to schedule follow-up appointments for their patients.

**Impact**:
- Breaks clinical workflow
- Doctors cannot schedule necessary follow-ups
- Manual workarounds required

**Required Changes**:
```typescript
// File: apps/web/src/app/api/appointments/route.ts
// Update POST endpoint to include 'doctor' role:
requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'patient'])
```

**Files to Update**:
- `apps/web/src/app/api/appointments/route.ts` - Add doctor to allowed roles
- `apps/web/src/app/(protected)/medical-records/[id]/page.tsx` - Verify "Schedule Follow-up" button permissions

---

### 3. 📤 File Upload Failures - Investigations/Attachments Not Working
**Reported by**: Hope Adeyi (Doctor), Glorious Kate Akpegah (Doctor), Odey Eneyi (Doctor)  
**Status**: 🔴 CRITICAL - Blocks clinical documentation  

**Issue Description**:
- Unable to upload pictures/docs/PDFs/investigations (shows "failed")
- Test results upload keeps loading indefinitely
- Attachments not working

**Impact**:
- Cannot attach lab results to patient records
- Cannot upload medical images or documents
- Clinical documentation incomplete

**Investigation Required**:
1. Check API endpoint `/api/upload/file`
2. Verify Backblaze B2 credentials and permissions
3. Check file size limits
4. Review browser console for errors
5. Test S3Client connection

**Files to Investigate**:
- `apps/web/src/app/api/upload/file/route.ts` - File upload endpoint
- `apps/web/src/lib/storage.ts` - Backblaze B2 integration
- Environment variables (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`)

**Potential Fixes**:
```typescript
// Check for:
- File size validation (currently 10MB limit)
- Content-Type validation
- S3 credentials expiration
- Bucket permissions
- CORS configuration
- Network timeout issues
```

---

## 🔥 HIGH PRIORITY ISSUES

### 4. 🔄 Reorder Navigation - Investigation Tab Before Prescription Tab
**Reported by**: Hope Adeyi (Doctor)  
**Status**: 🟡 HIGH - UX Improvement  
**Approved Action**: Reorder Investigation tab to come before prescription tab

**Issue Description**:
Clinical workflow suggests investigations should be ordered before prescriptions are written.

**Impact**:
- Non-intuitive workflow
- Doctors expect investigations first
- Minor UX confusion

**Required Changes**:
```typescript
// File: apps/web/src/components/layout/sidebar.tsx or navigation component
// Reorder menu items:

Current Order:
- Prescriptions
- Investigations

New Order:
- Investigations  
- Prescriptions
```

**Files to Update**:
- `apps/web/src/components/layout/sidebar.tsx` - Reorder navigation items
- Any dashboard quick action components with this order

---

### 5. 🔒 Patient Information Editing - Restrict to Records Staff Only
**Reported by**: Odey Eneyi (Doctor)  
**Status**: 🟡 HIGH - Security/Access Control  

**Issue Description**:
Doctors can currently edit patients' personal information. This should be restricted to records staff (receptionist/admin) only.

**Impact**:
- Potential data integrity issues
- Violates separation of duties
- Not aligned with hospital workflows

**Required Changes**:
```typescript
// File: apps/web/src/app/(protected)/patients/[id]/page.tsx
// Disable edit for doctors, allow only for admin/receptionist

// Show edit button only for:
const canEditPatient = ['admin', 'receptionist'].includes(session.user.role);

// API endpoint protection:
// File: apps/web/src/app/api/patients/[id]/route.ts
// PUT endpoint should require: requireRole(['admin', 'receptionist'])
```

**Files to Update**:
- `apps/web/src/app/(protected)/patients/[id]/page.tsx` - Conditional edit button
- `apps/web/src/app/api/patients/[id]/route.ts` - Update PUT endpoint permissions
- `apps/web/src/app/(protected)/patients/page.tsx` - Hide "Add Patient" for doctors

---

### 6. 📝 Department Suggestions - Missing for Appointment Booking
**Reported by**: Anonymous (Patient)  
**Status**: 🟡 HIGH - UX Improvement  

**Issue Description**:
When booking an appointment, the department field has no suggestions. Patients may not know which department to select.

**Impact**:
- Patient confusion
- Potential incorrect department selection
- Poor UX for non-medical users

**Required Changes**:
```typescript
// File: apps/web/src/app/(protected)/appointments/new/page.tsx
// Replace text input with dropdown/select:

<Select
  label="Department"
  name="department"
  value={formData.department}
  onChange={handleInputChange}
>
  <option value="">Select Department (Optional)</option>
  <option value="General Medicine">General Medicine</option>
  <option value="Pediatrics">Pediatrics</option>
  <option value="Surgery">Surgery</option>
  <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
  <option value="Cardiology">Cardiology</option>
  <option value="Orthopedics">Orthopedics</option>
  <option value="Emergency">Emergency</option>
  <option value="Dentistry">Dentistry</option>
  <option value="Ophthalmology">Ophthalmology</option>
  <option value="ENT">ENT (Ear, Nose, Throat)</option>
</Select>
```

**Files to Update**:
- `apps/web/src/app/(protected)/appointments/new/page.tsx` - Replace input with select dropdown

---

## ✅ ALREADY FIXED ISSUES

### 7. ✅ Edit Medical Records - 404 Page Not Found
**Reported by**: Odey Eneyi (Doctor), Glorious Kate Akpegah (Doctor)  
**Status**: ✅ FIXED (November 12, 2025)

**Issue**: Edit button led to 404 error page  
**Fix**: Created complete edit page at `/medical-records/[id]/edit`  
**Files Added**: `apps/web/src/app/(protected)/medical-records/[id]/edit/page.tsx`

---

### 8. ✅ Attachments Display - Not Showing After Upload
**Reported by**: Multiple users (implicit from upload issues)  
**Status**: ✅ FIXED (November 12, 2025)

**Issue**: Uploaded attachments weren't displayed on medical record detail page  
**Fix**: 
- Parse JSON attachments when fetching records
- Create authenticated download endpoint
- Display attachments with view/download buttons

**Files Updated**:
- `apps/web/src/app/(protected)/medical-records/[id]/page.tsx`
- `apps/web/src/app/api/files/download/route.ts` (new)

---

## 📊 IMPLEMENTATION PRIORITY MATRIX

| Issue | Priority | Complexity | Impact | Estimated Time |
|-------|----------|------------|--------|----------------|
| 1. Patient appointment booking | CRITICAL | Low | High | 30 mins |
| 2. Doctor appointment booking | CRITICAL | Low | High | 30 mins |
| 3. File upload failures | CRITICAL | Medium-High | High | 2-4 hours |
| 4. Reorder Investigation/Prescription | HIGH | Low | Low | 15 mins |
| 5. Restrict patient info editing | HIGH | Low | Medium | 1 hour |
| 6. Department suggestions | HIGH | Low | Medium | 30 mins |
| 7. Edit medical records ✅ | - | - | - | DONE |
| 8. Attachments display ✅ | - | - | - | DONE |

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Critical Permissions (1-2 hours)
1. ✅ Fix patient appointment booking permissions
2. ✅ Fix doctor appointment booking permissions
3. ✅ Test appointment workflow end-to-end

### Phase 2: File Upload Investigation (2-4 hours)
4. 🔍 Debug file upload failures
   - Check API logs
   - Verify B2 credentials
   - Test with different file types/sizes
   - Check browser console errors
5. ✅ Fix identified issues
6. ✅ Test uploads with actual users

### Phase 3: UX Improvements (2 hours)
7. ✅ Reorder Investigation/Prescription tabs
8. ✅ Add department dropdown with suggestions
9. ✅ Restrict patient editing to records staff

### Phase 4: Testing & Validation (2 hours)
10. ✅ Comprehensive role-based testing
11. ✅ User acceptance testing with feedback providers
12. ✅ Deploy to production

**Total Estimated Time**: 7-10 hours

---

## 🔧 TECHNICAL NOTES

### Permission System Overview
```typescript
// Current role hierarchy:
- admin: Full access
- doctor: Clinical operations
- nurse: Patient care
- pharmacist: Medication management
- lab_tech: Lab operations
- cashier: Billing
- receptionist: Front desk, patient registration
- patient: Personal records access
```

### Files Requiring Permission Updates
1. `apps/web/src/app/api/appointments/route.ts`
2. `apps/web/src/app/api/patients/[id]/route.ts`
3. `apps/web/src/lib/auth.ts` (if central permission config exists)

### Environment Variables to Verify
```bash
S3_ENDPOINT=https://s3.us-east-005.backblazeb2.com
S3_REGION=us-east-005
S3_BUCKET=emr-uploads
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
S3_PUBLIC_URL=https://f005.backblazeb2.com/file/emr-uploads
```

---

## 📝 TESTING CHECKLIST

### Before Deployment
- [ ] Patient can book appointments
- [ ] Doctor can book follow-up appointments for patients
- [ ] File uploads work for all file types (PDF, JPG, PNG, DOC)
- [ ] Investigation tab appears before Prescription tab
- [ ] Doctors cannot edit patient personal information
- [ ] Patients can select from department dropdown
- [ ] All existing functionality still works
- [ ] Test with multiple user roles

### After Deployment
- [ ] Monitor error logs for permission issues
- [ ] Verify file uploads in production environment
- [ ] Collect user feedback on changes
- [ ] Update documentation

---

## 👥 FEEDBACK CONTRIBUTORS

**Thank you to our testing team**:
- Olaide OLAWUWO (Patient)
- Hope Adeyi (Medical Doctor)
- Odey Eneyi (Medical Doctor)
- Glorious Kate Akpegah (Doctor)
- Anonymous Patient Testers

---

## 📞 NEXT STEPS

1. **Review**: Team review of this document
2. **Prioritize**: Confirm implementation order
3. **Implement**: Begin Phase 1 (Critical Permissions)
4. **Test**: Comprehensive testing after each phase
5. **Deploy**: Production deployment with monitoring
6. **Feedback**: Collect post-fix feedback from users

---

**Last Updated**: November 12, 2025  
**Document Owner**: Development Team  
**Status**: Ready for Implementation
