# Bulk Vitals Upload - Implementation Documentation

## ✅ Overview
Successfully implemented bulk vitals upload feature via Excel files, similar to the existing bulk upload functionality for patients, inventory, and other modules.

---

## 🎯 Feature Summary

**What:** Excel-based bulk upload system for patient vitals  
**Why:** Enables efficient batch recording of vitals for multiple patients  
**Who:** Doctors, Nurses, and Admins

---

## 📁 Files Created/Modified

### **Created Files:**

1. ✅ **`apps/web/src/app/api/vitals/excel/template/route.ts`**
   - GET endpoint for downloading Excel template
   - Includes 3 sheets: Template, Instructions, Reference Values
   - Sample data provided for guidance
   - Column width optimization for readability

2. ✅ **`apps/web/src/app/api/vitals/excel/import/route.ts`**
   - POST endpoint for importing Excel files
   - Comprehensive validation for all vital fields
   - Patient ID verification against hospital database
   - Automatic BMI calculation
   - Detailed error reporting

### **Modified Files:**

3. ✅ **`apps/web/src/app/(protected)/vitals/page.tsx`**
   - Added bulk upload UI section
   - Template download button
   - File upload input with validation
   - Upload results display with success/error breakdown
   - Toast notifications for user feedback

---

## 📊 Excel Template Structure

### **Sheet 1: Vitals Template**

**Required Fields (*):**
- `Patient ID*` - Must exist in hospital database
- `Blood Pressure Systolic* (mmHg)` - 60-250 range
- `Blood Pressure Diastolic* (mmHg)` - 40-150 range
- `Recorded Date* (YYYY-MM-DD HH:mm)` - DateTime format

**Optional Fields:**
- `Temperature (°C)` - 30-45 range
- `Heart Rate (BPM)` - 30-250 range
- `Respiratory Rate (per min)` - 5-60 range
- `Oxygen Saturation (%)` - 70-100 range
- `Weight (kg)` - 1-500 range
- `Height (cm)` - 30-300 range
- `Notes` - Free text

**Auto-calculated:**
- `BMI` - Calculated from weight and height if both provided

### **Sheet 2: Instructions**
16 step-by-step instructions for using the template

### **Sheet 3: Reference Values**
Normal ranges for all vital signs:
- Temperature: 36.1°C - 37.2°C
- BP Systolic: 90 - 120 mmHg
- BP Diastolic: 60 - 80 mmHg
- Heart Rate: 60 - 100 BPM
- Respiratory Rate: 12 - 20 per min
- Oxygen Saturation: 95% - 100%
- BMI: 18.5 - 24.9

---

## 🔍 Validation Rules

### **Patient ID Validation:**
```typescript
- Must be a positive integer
- Must exist in the hospital's patient database
- Error: "Patient ID {id} not found in this hospital"
```

### **Blood Pressure Validation:**
```typescript
- Systolic: 60-250 mmHg
- Diastolic: 40-150 mmHg
- Diastolic must be < Systolic
- Both required fields
```

### **Temperature Validation:**
```typescript
- Range: 30°C - 45°C
- Decimal values supported (e.g., 37.5)
- Optional field
```

### **Heart Rate Validation:**
```typescript
- Range: 30-250 BPM
- Integer value
- Optional field
```

### **Respiratory Rate Validation:**
```typescript
- Range: 5-60 breaths per minute
- Integer value
- Optional field
```

### **Oxygen Saturation Validation:**
```typescript
- Range: 70-100%
- Decimal values supported (e.g., 98.5)
- Optional field
```

### **Weight & Height Validation:**
```typescript
- Weight: 1-500 kg
- Height: 30-300 cm
- Both decimal values supported
- BMI auto-calculated if both provided
```

### **Date Validation:**
```typescript
- Format: YYYY-MM-DD HH:mm
- Example: 2024-01-15 09:30
- Must be valid date/time
- Required field
```

---

## 🔧 API Endpoints

### **GET /api/vitals/excel/template**

**Authorization:** Admin, Doctor, Nurse

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Filename: `Vitals_Recording_Template_YYYY-MM-DD.xlsx`

**Features:**
- 3 sheets (Template, Instructions, Reference Values)
- Sample data with 3 example rows
- Column width optimization
- Professional formatting

---

### **POST /api/vitals/excel/import**

**Authorization:** Admin, Doctor, Nurse

**Request:**
- Content-Type: `multipart/form-data`
- File parameter: `file` (.xlsx or .xls)
- Max size: 10MB

**Response:**
```typescript
{
  success: boolean,
  message: string,
  imported: number,        // Successfully imported records
  failed: number,          // Failed records
  results: [               // Successful imports
    {
      row: number,
      vitalId: number,
      patientId: number,
      success: true
    }
  ],
  errors: [                // Failed imports with details
    {
      row: number,
      errors: string[],
      data: { patientId: number }
    }
  ]
}
```

**Validation Process:**
1. File type validation (.xlsx or .xls)
2. Parse Excel file using XLSX library
3. Validate each row:
   - Required fields presence
   - Data type validation
   - Range validation
   - Logical validation (e.g., diastolic < systolic)
4. Verify patient IDs exist in hospital database
5. Import valid records
6. Return detailed results with errors

---

## 💻 UI Components

### **Bulk Upload Section:**

Located on `/vitals` page, visible to doctors, nurses, and admins.

**Features:**
- Gradient background (blue to green)
- Dashed border for visual emphasis
- FileSpreadsheet icon
- Two action buttons side-by-side

### **Download Template Button:**
```typescript
- Triggers GET /api/vitals/excel/template
- Downloads with current date in filename
- Toast notification on success/error
```

### **Upload Excel Button:**
```typescript
- File input (hidden, styled as button)
- Accept: .xlsx, .xls
- Max size: 10MB validation
- Disabled during upload
- Shows "Uploading..." state
```

### **Upload Results Display:**

Shows after successful/failed upload with:
- Success/warning icon based on results
- Close button (X)
- Two-column grid:
  - Green box: Successfully Imported count
  - Red box: Failed count
- Expandable error list (max-height with scroll)
- Per-row error details with:
  - Row number
  - List of validation errors
  - Associated patient ID

---

## 🎨 User Experience Flow

### **1. Download Template**
```
User clicks "Download Template"
→ Toast: "Downloading template..."
→ Browser downloads Excel file
→ Toast: "Template downloaded successfully"
```

### **2. Fill Template Offline**
```
User opens Excel file
→ Reads instructions sheet
→ Refers to reference values sheet
→ Fills patient vitals data
→ Deletes example rows
→ Saves file
```

### **3. Upload Filled Template**
```
User clicks "Upload Excel"
→ Selects file from computer
→ File validation (type, size)
→ Toast: "Processing Excel file..."
→ Upload in progress (button disabled)
→ Server validates and imports
→ Results displayed on page
→ Toast notifications for success/errors
→ Vitals list refreshes automatically
```

---

## 🔒 Security Features

### **Authentication:**
- Requires active session
- Role-based access (admin, doctor, nurse only)
- Hospital ID verification

### **Data Validation:**
- Server-side validation for all fields
- Patient ID must belong to user's hospital
- Prevents cross-hospital data access

### **File Upload Safety:**
- File type restriction (.xlsx, .xls only)
- File size limit (10MB max)
- Secure file parsing with XLSX library

---

## 📈 Database Operations

### **Patient Verification:**
```sql
SELECT id FROM patients 
WHERE id IN (...patient_ids) 
AND hospital_id = ?
```

### **Vital Record Creation:**
```sql
INSERT INTO vitals (
  hospital_id,
  patient_id,
  recorded_by,
  temperature,
  blood_pressure_sys,
  blood_pressure_dia,
  heart_rate,
  respiratory_rate,
  oxygen_saturation,
  weight,
  height,
  bmi,
  notes,
  recorded_at
) VALUES (...)
```

**Data Types:**
- `temperature`: Decimal(4,1)
- `bloodPressureSys`: Integer
- `bloodPressureDia`: Integer
- `heartRate`: Integer
- `respiratoryRate`: Integer
- `oxygenSaturation`: Decimal(5,2)
- `weight`: Decimal(5,2)
- `height`: Decimal(5,2)
- `bmi`: Decimal(4,2)
- `recordedAt`: DateTime

---

## ✅ Testing Checklist

- [x] Template downloads with correct filename
- [x] Template has 3 sheets (Template, Instructions, Reference)
- [x] Template includes sample data
- [x] Upload accepts .xlsx and .xls files
- [x] Upload rejects other file types
- [x] Upload rejects files > 10MB
- [x] Required fields validation works
- [x] Optional fields can be empty
- [x] Patient ID verification against hospital
- [x] Blood pressure validation (sys > dia)
- [x] Temperature range validation
- [x] Heart rate range validation
- [x] Respiratory rate range validation
- [x] Oxygen saturation range validation
- [x] Weight and height range validation
- [x] BMI auto-calculation works
- [x] Date format validation
- [x] Error messages are clear and specific
- [x] Success toast shows imported count
- [x] Error details display properly
- [x] Vitals list refreshes after import
- [x] Upload button disabled during upload
- [x] File input resets after upload
- [x] Results can be dismissed
- [x] Role-based access control works

---

## 💡 Business Value

### **Efficiency Gains:**
- ✅ Bulk upload vs. manual entry saves hours
- ✅ Can import dozens of vitals in seconds
- ✅ Reduces data entry errors
- ✅ Enables offline data collection

### **Use Cases:**
1. **Mobile Clinics:** Record vitals offline, upload later
2. **Health Camps:** Batch record community screenings
3. **Ward Rounds:** Collect vitals for all patients, bulk upload
4. **Data Migration:** Import historical vitals data
5. **Multi-Patient Monitoring:** ICU/ward batch recordings

### **Quality Improvements:**
- ✅ Comprehensive validation prevents bad data
- ✅ Reference values guide proper recording
- ✅ Auto-calculated BMI reduces errors
- ✅ Detailed error reporting for corrections

---

## 🚀 Performance Considerations

### **Optimizations:**
- Batch patient ID verification (single query)
- Transaction-based imports for data integrity
- File size limit prevents memory issues
- Efficient Excel parsing with XLSX library

### **Scalability:**
- Handles up to 10MB files (~10,000 rows)
- Parallel validation processing
- Async mutation with React Query
- Query invalidation for real-time updates

---

## 📋 Example Template Data

```excel
| Patient ID* | Temperature (°C) | BP Sys* | BP Dia* | HR | RR | SpO2 | Weight | Height | Recorded Date*      | Notes                        |
|-------------|------------------|---------|---------|----|----|------|--------|--------|---------------------|------------------------------|
| 1           | 37.5             | 120     | 80      | 72 | 16 | 98   | 70.5   | 175    | 2024-01-15 09:30    | Patient was resting          |
| 2           | 36.8             | 115     | 75      | 68 | 14 | 99   | 65.2   | 168    | 2024-01-15 10:00    | Routine checkup vitals       |
| 3           | 38.2             | 130     | 85      | 88 | 20 | 96   | 82.0   | 180    | 2024-01-15 11:15    | Patient reporting fever      |
```

---

## 🎯 Success Metrics

**Target:**
- 95% successful import rate
- < 5 seconds processing time for 100 records
- Zero data integrity issues
- Clear error messages for all failures

**Monitoring:**
- Track import success/failure rates
- Monitor file sizes and processing times
- Log validation errors for improvement
- User feedback on template clarity

---

## 📚 Related Features

This bulk upload feature follows the same pattern as:
- ✅ Bulk Patient Registration (`/api/patients/excel/*`)
- ✅ Bulk Inventory Upload (`/api/inventory/excel/*`)
- ✅ Bulk Medical Records (`/api/medical-records/excel/*`)
- ✅ Bulk Appointments (`/api/appointments/excel/*`)
- ✅ Bulk Users (`/api/users/excel/*`)

---

## 🔮 Future Enhancements

**Potential Improvements:**
1. Excel export of existing vitals
2. Batch edit via Excel
3. Appointment linking in bulk upload
4. Multi-sheet support (one sheet per day/ward)
5. Duplicate detection
6. Data validation with conditional formatting
7. Template customization per hospital
8. Email notifications for large imports
9. Scheduled bulk imports
10. API for third-party integrations

---

**Status:** ✅ COMPLETE  
**Date:** December 2, 2025  
**Feature:** Bulk Vitals Upload via Excel  
**Quality:** Production-ready  
**Documentation:** Complete  

🎉 **Bulk vitals upload feature successfully implemented!**
