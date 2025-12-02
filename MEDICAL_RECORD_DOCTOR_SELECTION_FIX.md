# Medical Record Doctor Selection Fix

## 🐛 **Issue**
Admin users got "Doctor ID is required" error when creating medical records.

---

## ✅ **Root Cause**

The API has different logic based on user role:

```typescript
// From /api/medical-records route.ts (lines 172-180)

if (userRole === 'doctor') {
  doctorId = parseInt(session.user.id);  // ✅ Doctors use their own ID
} else if (providedDoctorId) {
  doctorId = parseInt(providedDoctorId); // ✅ Others must provide doctorId
} else {
  return apiResponse({ error: 'Doctor ID is required' }, 400); // ❌ Error!
}
```

**The Problem:**
- Frontend form had NO doctor selection field
- Admin/nurse/receptionist users couldn't provide `doctorId`
- API rejected the request with "Doctor ID is required"

---

## ✅ **Fix Applied**

Added doctor selection field that **only shows for non-doctor users** (admin, nurse, receptionist).

### **Changes to Frontend Form:**

1. **Added Doctor interface:**
```typescript
interface Doctor {
  id: number;
  name: string;
}
```

2. **Added role checks:**
```typescript
const isDoctor = session?.user?.role === 'doctor';
const requiresDoctorSelection = ['admin', 'nurse', 'receptionist'].includes(session.user.role);
```

3. **Added doctorId to form state:**
```typescript
const [formData, setFormData] = useState({
  patientId: preSelectedPatientId || '',
  doctorId: '',  // ← NEW
  visitDate: new Date().toISOString().split('T')[0],
  diagnosis: '',
  notes: '',
  allergies: '',
});
```

4. **Fetch doctors list (conditional):**
```typescript
const { data: doctors } = useQuery<{ users: Doctor[] }>({
  queryKey: ['doctors-all'],
  queryFn: async () => {
    const response = await axios.get('/api/users?role=doctor&limit=100');
    return response.data;
  },
  enabled: requiresDoctorSelection, // ← Only fetch if needed
});
```

5. **Validation before submit:**
```typescript
if (requiresDoctorSelection) {
  if (!formData.doctorId) {
    toast.error('Please select a doctor');
    return;
  }
  payload.doctorId = formData.doctorId;
}
```

6. **Added Doctor Selection UI (conditional):**
```typescript
{requiresDoctorSelection && (
  <div>
    <h2 className="text-lg font-semibold mb-4">Attending Doctor</h2>
    <Select
      label="Doctor"
      name="doctorId"
      value={formData.doctorId}
      onChange={handleInputChange}
      required
    >
      <option value="">Select doctor</option>
      {doctors?.users.map((doctor) => (
        <option key={doctor.id} value={doctor.id}>
          Dr. {doctor.name}
        </option>
      ))}
    </Select>
  </div>
)}
```

---

## 🎯 **How It Works Now**

### **For Doctors:**
```
1. Doctor creates medical record
2. Form shows: Patient, Visit Date, Clinical Info (NO doctor selection)
3. API uses doctor's own ID automatically
4. ✅ Record created with doctorId = doctor's ID
```

### **For Admin/Nurse/Receptionist:**
```
1. Admin creates medical record
2. Form shows: Patient, Visit Date, Doctor Selection, Clinical Info
3. Admin must select which doctor is attending
4. API uses the selected doctorId
5. ✅ Record created with doctorId = selected doctor's ID
```

---

## 🧪 **Testing**

### **Test 1: Admin Creating Record**
1. Login as Admin
2. Go to "New Medical Record"
3. ✅ Should see "Attending Doctor" dropdown
4. Select patient, date, and **doctor**
5. ✅ Record created successfully

### **Test 2: Doctor Creating Record**
1. Login as Doctor
2. Go to "New Medical Record"
3. ✅ Should NOT see doctor dropdown (uses own ID)
4. Select patient, date
5. ✅ Record created successfully

### **Test 3: Validation**
1. Login as Admin
2. Go to "New Medical Record"
3. Fill patient and date but DON'T select doctor
4. Click Create
5. ✅ Should show error: "Please select a doctor"

---

## 📋 **User Roles Behavior**

| Role | Doctor Selection Field | DoctorId Source |
|------|----------------------|----------------|
| **Doctor** | ❌ Hidden | Uses own user ID |
| **Admin** | ✅ Required | Must select doctor |
| **Nurse** | ✅ Required | Must select doctor |
| **Receptionist** | ✅ Required | Must select doctor |

---

## 📝 **Files Modified**

1. ✅ `apps/web/src/app/(protected)/medical-records/new/page.tsx`
   - Added Doctor interface (line 19-22)
   - Added role checks (lines 29-30)
   - Added doctorId to formData (line 36)
   - Fetch doctors list conditionally (lines 55-63)
   - Validation before submit (lines 108-115)
   - Added doctor selection UI (lines 172-191)

---

## 🎉 **Summary**

**What Was Broken:**
- ❌ Admin couldn't create medical records (missing doctorId)
- ❌ No way to specify which doctor for the record
- ❌ Form didn't match API requirements

**What's Fixed:**
- ✅ Admin now sees doctor selection dropdown
- ✅ Validation ensures doctor is selected
- ✅ API receives correct doctorId
- ✅ Doctors still don't see the field (automatic)

**Result:**
- Admins can create medical records by selecting the attending doctor
- Doctors create records normally (uses their own ID)
- Proper validation and user feedback

---

**Status:** FIX DEPLOYED ✅  
**Action Required:** None - Ready to test  
**Expected Result:** Admin can now create medical records successfully
