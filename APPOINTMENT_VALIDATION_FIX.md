# Appointment Validation Fix - Prevent Prisma NaN Errors

## Issue
Prisma error occurs when `parseInt()` returns `NaN` and is passed to database queries:
```
Invalid prisma.patient.findFirst() invocation
Argument id is missing
```

## Root Cause
- `parseInt("invalid")` returns `NaN`
- Prisma query: `where: { id: NaN }` 
- Prisma expects a valid number or special filter object
- Gets `NaN` instead → throws error

---

## Fix Applied

### File: `apps/web/src/app/api/appointments/route.ts`

#### 1. **GET /api/appointments** (Line 13-16)
**Added session validation:**
```typescript
const hospitalId = parseInt(session.user.hospitalId);
const userId = parseInt(session.user.id);

// NEW: Validate session IDs
if (isNaN(hospitalId) || isNaN(userId)) {
  return apiResponse({ error: 'Invalid session data' }, 400);
}
```

**Prevents:**
- Corrupted session data
- Missing user IDs
- Non-numeric session values

---

#### 2. **POST /api/appointments** (Line 129-135)
**Added ID validation before database queries:**
```typescript
// Validation
if (!patientId || !doctorId || !appointmentType || !startTime) {
  return apiResponse({ error: 'Missing required fields' }, 400);
}

// NEW: Validate IDs are valid numbers
const parsedPatientId = parseInt(patientId);
const parsedDoctorId = parseInt(doctorId);

if (isNaN(parsedPatientId) || isNaN(parsedDoctorId) || isNaN(hospitalId)) {
  return apiResponse({ error: 'Invalid patient or doctor ID' }, 400);
}

// Use validated IDs
const [patient, doctor] = await Promise.all([
  prisma.patient.findFirst({ where: { id: parsedPatientId, hospitalId } }),
  prisma.user.findFirst({ where: { id: parsedDoctorId, hospitalId, role: 'doctor' } }),
]);
```

**Prevents:**
- Invalid patient/doctor IDs in request body
- Malformed API requests
- Frontend bugs passing non-numeric values

---

#### 3. **Updated All References** (Line 154, 168-169)
**Use parsed IDs consistently:**
```typescript
// Check for scheduling conflicts
const conflict = await prisma.appointment.findFirst({
  where: {
    doctorId: parsedDoctorId,  // Was: parseInt(doctorId)
    // ...
  },
});

// Create appointment
const appointment = await prisma.appointment.create({
  data: {
    patientId: parsedPatientId,  // Was: parseInt(patientId)
    doctorId: parsedDoctorId,    // Was: parseInt(doctorId)
    // ...
  },
});
```

**Benefits:**
- Parse once, use everywhere
- Validation happens upfront
- Cleaner code

---

## Previous Updates vs This Fix

### Previous Updates (PATIENT_APPOINTMENT_SECURITY.md)
✅ Fixed patient access control
✅ Fixed role-based UI hiding
✅ Fixed patient filtering logic
❌ **Did NOT add NaN validation**

### This Fix
✅ **Added NaN validation to prevent Prisma errors**
✅ Validates session data
✅ Validates request parameters
✅ Consistent ID parsing

---

## Error Prevention Matrix

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| **Valid booking** | ✅ Works | ✅ Works |
| **Invalid patientId: "abc"** | ❌ Prisma error | ✅ 400 "Invalid ID" |
| **Invalid doctorId: null** | ❌ Prisma error | ✅ 400 "Missing fields" |
| **Corrupted session** | ❌ Prisma error | ✅ 400 "Invalid session" |
| **NaN from parseInt** | ❌ Prisma error | ✅ 400 error |

---

## Code Changes Summary

```typescript
// BEFORE: ❌ Direct parsing, no validation
const [patient, doctor] = await Promise.all([
  prisma.patient.findFirst({ 
    where: { id: parseInt(patientId) }  // Could be NaN!
  }),
]);

// AFTER: ✅ Parse, validate, then use
const parsedPatientId = parseInt(patientId);

if (isNaN(parsedPatientId)) {
  return apiResponse({ error: 'Invalid patient ID' }, 400);
}

const [patient, doctor] = await Promise.all([
  prisma.patient.findFirst({ 
    where: { id: parsedPatientId }  // Guaranteed valid number
  }),
]);
```

---

## Testing Scenarios

### Test 1: Valid Booking ✅
```bash
POST /api/appointments
{
  "patientId": 123,
  "doctorId": 456,
  "appointmentType": "OPD",
  "startTime": "2025-11-21T10:00:00Z"
}

Response: 201 Created
```

### Test 2: Invalid Patient ID ✅
```bash
POST /api/appointments
{
  "patientId": "invalid",
  "doctorId": 456,
  "appointmentType": "OPD",
  "startTime": "2025-11-21T10:00:00Z"
}

Response: 400 { "error": "Invalid patient or doctor ID" }
```

### Test 3: Missing Fields ✅
```bash
POST /api/appointments
{
  "patientId": 123
}

Response: 400 { "error": "Missing required fields" }
```

### Test 4: Corrupted Session ✅
```bash
GET /api/appointments
Headers: { sessionId: "corrupted_session" }

Response: 400 { "error": "Invalid session data" }
```

---

## Impact

**Endpoints Protected:**
- ✅ `GET /api/appointments` - List appointments
- ✅ `POST /api/appointments` - Book appointment

**Error Messages:**
- **Before**: `Invalid prisma.patient.findFirst() invocation` (cryptic, 500)
- **After**: `Invalid patient or doctor ID` (clear, 400)

**User Experience:**
- **Before**: System crash, unclear error
- **After**: Clear error message, proper HTTP status

---

## Why This Matters

### Security
- Prevents database query injection with invalid types
- Validates all user inputs upfront
- Fails fast with clear errors

### Reliability
- No Prisma crashes from NaN
- Better error logging
- Easier debugging

### Developer Experience
- Clear error messages
- Validation at API boundary
- Single source of truth for parsed IDs

---

## Future Recommendations

### 1. Create Validation Helper
```typescript
// File: apps/web/src/lib/validators.ts
export function validateIds(ids: Record<string, any>): {
  valid: boolean;
  parsed: Record<string, number>;
  error?: string;
} {
  const parsed: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(ids)) {
    const num = parseInt(value);
    if (isNaN(num)) {
      return { valid: false, parsed: {}, error: `Invalid ${key}` };
    }
    parsed[key] = num;
  }
  
  return { valid: true, parsed };
}

// Usage:
const result = validateIds({ patientId, doctorId });
if (!result.valid) {
  return apiResponse({ error: result.error }, 400);
}
const { patientId: parsedPatientId, doctorId: parsedDoctorId } = result.parsed;
```

### 2. Apply to Other Endpoints
Check similar patterns in:
- `apps/web/src/app/api/patients/[id]/route.ts`
- `apps/web/src/app/api/medical-records/[id]/route.ts`
- `apps/web/src/app/api/prescriptions/[id]/route.ts`
- `apps/web/src/app/api/lab-orders/[id]/route.ts`

### 3. Add Request Schema Validation
Consider using Zod for comprehensive validation:
```typescript
import { z } from 'zod';

const appointmentSchema = z.object({
  patientId: z.number().int().positive(),
  doctorId: z.number().int().positive(),
  appointmentType: z.enum(['OPD', 'IPD', 'surgery', 'lab', 'follow_up']),
  startTime: z.string().datetime(),
});
```

---

## Commit Message
```
fix: add ID validation to prevent Prisma NaN errors in appointment booking

- Validate session IDs in GET /api/appointments
- Validate patient/doctor IDs in POST /api/appointments
- Parse IDs once and reuse parsed values
- Return clear 400 errors instead of 500 Prisma errors

Fixes potential "Argument id is missing" Prisma error when invalid
IDs are passed to appointment booking or listing endpoints.
```

---

**Updated**: November 20, 2025  
**Status**: ✅ Fixed and deployed
