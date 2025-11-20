# Multi-Hospital User Support

## Overview
Users (staff and patients) can now be registered across multiple hospitals in the system.

---

## Changes Made

### Database Schema Update

**Before:**
```prisma
email  String  @unique  // Global unique constraint
```

**After:**
```prisma
email  String  // No global constraint

@@unique([hospitalId, email], name: "hospitalId_email")  // Unique per hospital
```

---

## How It Works

### ✅ **Allowed:**
- **Same email, different hospitals** ✓
  - Dr. John (john@email.com) at City Hospital
  - Dr. John (john@email.com) at General Hospital
  - Dr. John (john@email.com) at Teaching Hospital

### ❌ **Not Allowed:**
- **Same email, same hospital** ✗
  - Dr. John (john@email.com) at City Hospital
  - Dr. Jane (john@email.com) at City Hospital ← ERROR

---

## Use Cases

### 1. **Locum Doctors**
A doctor works part-time at multiple hospitals:
- Register once at Hospital A with role: `doctor`
- Register again at Hospital B with role: `doctor`
- Register at Hospital C with role: `doctor`
- Each registration is independent with separate permissions

### 2. **Staff with Multiple Roles**
A pharmacist who also works as admin at different facilities:
- Register at Clinic A with role: `pharmacist`
- Register at Clinic B with role: `admin`
- Register at Hospital C with role: `pharmacist`

### 3. **Patients Seeking Care**
A patient who visits multiple hospitals:
- Register at Hospital A as patient
- Register at Hospital B as patient
- Separate medical records at each facility

### 4. **Consultants**
Specialist doctors providing services across network:
- Teaching Hospital (primary)
- Partner Clinic (part-time)
- Private Practice (weekends)

---

## Impact on Existing Features

### ✅ **Login System**
- Users must select their hospital during login
- Or login page can show dropdown of hospitals where user exists

### ✅ **Permissions**
- Role and permissions are hospital-specific
- Doctor at Hospital A doesn't automatically have access to Hospital B

### ✅ **Medical Records**
- Each hospital maintains separate records
- Patient history is isolated per hospital

### ✅ **Billing & Claims**
- Invoices are hospital-specific
- HMO claims tied to specific hospital registration

---

## Developer Notes

### Creating Users
When creating a user in multiple hospitals:

```typescript
// Hospital 1
await prisma.user.create({
  data: {
    hospitalId: 1,
    email: "doctor@email.com",
    name: "Dr. John Doe",
    role: "doctor",
    hashedPassword: "...",
  },
});

// Hospital 2 - Same email, different hospital ✓
await prisma.user.create({
  data: {
    hospitalId: 2,
    email: "doctor@email.com",  // Same email OK
    name: "Dr. John Doe",
    role: "doctor",
    hashedPassword: "...",
  },
});
```

### Querying Users
Always filter by hospital:

```typescript
// Find user by email in specific hospital
const user = await prisma.user.findFirst({
  where: {
    email: "doctor@email.com",
    hospitalId: 1,  // Important!
  },
});

// Find all hospitals where user exists
const userAccounts = await prisma.user.findMany({
  where: {
    email: "doctor@email.com",
  },
  include: {
    hospital: true,
  },
});
```

### Unique Constraint Name
```
hospitalId_email
```

Use this when handling constraint violations:
```typescript
try {
  await prisma.user.create({ ... });
} catch (error) {
  if (error.code === 'P2002' && error.meta?.target?.includes('hospitalId_email')) {
    throw new Error('User with this email already exists in this hospital');
  }
}
```

---

## Migration Applied

**Command Used:**
```bash
pnpm prisma db push
```

**Warning Ignored:**
> A unique constraint covering the columns `[hospital_id,email]` on the table `users` will be added.

No data loss occurred as there were no duplicate email/hospital combinations.

---

## Testing

### Test Scenario 1: Create User in Multiple Hospitals
```typescript
// ✅ Should succeed
const user1 = await createUser({
  hospitalId: 1,
  email: "test@example.com",
  role: "doctor",
});

const user2 = await createUser({
  hospitalId: 2,
  email: "test@example.com",  // Same email
  role: "nurse",
});

console.log(user1.id !== user2.id);  // true - different IDs
```

### Test Scenario 2: Prevent Duplicate in Same Hospital
```typescript
// ❌ Should fail
const user1 = await createUser({
  hospitalId: 1,
  email: "test@example.com",
  role: "doctor",
});

const user2 = await createUser({
  hospitalId: 1,
  email: "test@example.com",  // Same hospital + email
  role: "nurse",
});
// Error: Unique constraint failed on the fields: (hospitalId_email)
```

---

## Recommendations

### 1. **Update Login Flow**
Consider adding hospital selection if user exists in multiple hospitals:

```typescript
// Check if email exists in multiple hospitals
const hospitals = await prisma.user.findMany({
  where: { email },
  select: { 
    hospitalId: true,
    hospital: { select: { name: true } },
  },
});

if (hospitals.length > 1) {
  // Show hospital selector
  return { requireHospitalSelection: true, hospitals };
}
```

### 2. **Profile Management**
Create a unified profile view showing all hospital affiliations:
- List of hospitals where user is registered
- Ability to switch between hospital contexts
- View role at each facility

### 3. **Data Synchronization** (Future)
Consider linking user accounts:
- Add optional `globalUserId` field
- Link accounts for same person
- Share basic profile data (name, contact)
- Keep hospital-specific data separate

---

## Security Considerations

### ✅ **Isolation**
- Users cannot access data from hospitals they're not registered in
- Middleware must always check `hospitalId` matches session
- API routes must filter by `hospitalId`

### ✅ **Authentication**
- Each hospital registration has separate password
- Password reset is hospital-specific
- Session management per hospital

### ⚠️ **Important**
Never assume email uniqueness globally. Always query with both:
```typescript
{ email: "...", hospitalId: ... }
```

---

## Summary

✅ **Before**: One email = one user globally  
✅ **After**: One email = one user per hospital  

This change enables healthcare professionals and patients to work with multiple facilities while maintaining data isolation and security.

---

**Updated**: November 2025  
**Schema Version**: Post multi-hospital support
