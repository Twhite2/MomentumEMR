# ✅ **HMO Tariff Validation Mode**

## 🎯 **Feature Overview:**

The HMO tariff import now supports **VALIDATION-ONLY MODE** that checks your data **WITHOUT importing**, so you can:

1. ✅ **Validate First** - See all errors and warnings before importing
2. ✅ **Fix Excel** - Correct issues at source in your Excel file
3. ✅ **Import Clean** - Upload with confidence, no surprises

---

## 🔍 **How It Works:**

### **Two Modes:**

#### **1. Validation Mode** (`validateOnly=true`)
- Checks all data quality
- Reports all issues and warnings
- **Does NOT import** anything
- **Does NOT modify** your database

#### **2. Import Mode** (`validateOnly=false` or omitted)
- Actually imports data
- Skips/transforms problematic rows
- Updates database

---

## 📊 **What Gets Validated:**

### **For AXA Tariffs:**

#### **Errors** (Must Fix):
- ❌ **Missing Code** - Required field
- ❌ **Missing Name** - Required field

#### **Warnings** (Can Import, But Will Be Adjusted):
- ⚠️ **Invalid Date** - Will be set to `null`
  - Example: `+045291-12-31` → `null`
  - Years < 1900 or > 2100 → `null`
- ⚠️ **Invalid Price** - Will be set to `0`
  - Example: `"N/A"` → `0`
  - Example: `"TBD"` → `0`

---

## 🎨 **Validation Response Format:**

### **Success (No Errors):**
```json
{
  "mode": "validation",
  "isValid": true,
  "canImport": true,
  "summary": {
    "totalRows": 1015,
    "validRows": 1015,
    "errorCount": 0,
    "warningCount": 27,
    "sheetsValidated": [
      "BundledHealthService",
      "Consultation",
      "DiagnosticAndInvestigation",
      "DrugAndConsumables",
      "Procedure&..."
    ]
  },
  "issues": [],
  "warnings": [
    {
      "sheet": "BundledHealthService",
      "row": 45,
      "field": "EffectiveDate",
      "value": "+045291-12-31T23:00:00.000Z",
      "issue": "Invalid date (will be set to null if imported)",
      "severity": "warning"
    },
    // ... 26 more warnings
  ],
  "message": "Validation passed with 27 warning(s). Data can be imported but some values will be adjusted."
}
```

### **Failed (Has Errors):**
```json
{
  "mode": "validation",
  "isValid": false,
  "canImport": false,
  "summary": {
    "totalRows": 1015,
    "validRows": 1008,
    "errorCount": 7,
    "warningCount": 27,
    "sheetsValidated": ["BundledHealthService", "Consultation", ...]
  },
  "issues": [
    {
      "sheet": "Consultation",
      "row": 23,
      "field": "Code",
      "issue": "Missing required field",
      "severity": "error"
    },
    {
      "sheet": "Consultation",
      "row": 23,
      "field": "Name",
      "issue": "Missing required field",
      "severity": "error"
    },
    // ... 5 more errors
  ],
  "warnings": [ ... ],
  "message": "Validation failed: 7 error(s) found. Fix issues in Excel file before importing."
}
```

---

## 🚀 **How To Use:**

### **Method 1: API Call (Direct)**

#### **Step 1: Validate**
```bash
curl -X POST http://localhost:3000/api/hmo/1/tariffs/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@axa_tariffs.xlsx" \
  -F "hmoType=axa" \
  -F "validateOnly=true"
```

**Response:**
```json
{
  "isValid": true,
  "canImport": true,
  "summary": { "totalRows": 1015, "validRows": 1015, ... },
  "warnings": [ ... ],
  "message": "Validation passed! All 1015 rows are ready to import."
}
```

#### **Step 2: Import (If Valid)**
```bash
curl -X POST http://localhost:3000/api/hmo/1/tariffs/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@axa_tariffs.xlsx" \
  -F "hmoType=axa"
  # No validateOnly parameter = import mode
```

---

### **Method 2: Using Postman/Thunder Client**

#### **Validation Request:**
```
POST /api/hmo/1/tariffs/import

Body (form-data):
- file: [Select Excel file]
- hmoType: axa
- validateOnly: true
```

#### **Import Request:**
```
POST /api/hmo/1/tariffs/import

Body (form-data):
- file: [Select Excel file]
- hmoType: axa
```

---

## 🎯 **Workflow Example:**

### **Scenario: Importing AXA Mansard Tariffs**

#### **Step 1: First Upload Attempt (Validation)**
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('hmoType', 'axa');
formData.append('validateOnly', 'true'); // ✅ Validation mode

const response = await axios.post('/api/hmo/1/tariffs/import', formData);

if (response.data.isValid) {
  // ✅ Ready to import!
  console.log('All good! Proceed with import.');
} else {
  // ❌ Has errors
  console.log('Fix these issues:', response.data.issues);
}
```

**Response:**
```json
{
  "isValid": false,
  "summary": { "errorCount": 7, "warningCount": 27 },
  "issues": [
    { "sheet": "Consultation", "row": 23, "field": "Code", "issue": "Missing required field" },
    { "sheet": "Consultation", "row": 23, "field": "Name", "issue": "Missing required field" },
    { "sheet": "DrugAndConsumables", "row": 156, "field": "Code", "issue": "Missing required field" },
    ...
  ]
}
```

#### **Step 2: Fix Excel File**
Open Excel → Navigate to:
- **Consultation sheet, row 23** → Add Code and Name
- **DrugAndConsumables sheet, row 156** → Add Code
- Fix remaining issues...

#### **Step 3: Re-Validate**
```javascript
formData.append('validateOnly', 'true');
const response = await axios.post('/api/hmo/1/tariffs/import', formData);
// Response: { "isValid": true, "canImport": true }
```

#### **Step 4: Import**
```javascript
// Remove validateOnly to import
const formData = new FormData();
formData.append('file', file);
formData.append('hmoType', 'axa');
// No validateOnly = import mode

const response = await axios.post('/api/hmo/1/tariffs/import', formData);
// Response: { "mode": "import", "success": true, "imported": 1015 }
```

---

## 📝 **Validation Details:**

### **Issue Severity:**

| Severity | Description | Can Import? | What Happens? |
|----------|-------------|-------------|---------------|
| **Error** | Missing required fields | ❌ No | Must fix before import |
| **Warning** | Invalid but can be adjusted | ✅ Yes | Value will be transformed |

### **What Gets Checked:**

#### **Required Fields (Errors):**
- ✅ `Code` - Tariff code
- ✅ `Name` - Service/item name

#### **Optional Fields (Warnings if Invalid):**
- ⚠️ `EffectiveDate` - Date format validation
- ⚠️ `Tariff` - Price/amount validation
- ⚠️ `Category` - Uses sheet name as fallback

---

## 🎨 **Console Logs:**

### **Validation Mode:**
```
📊 Found 5 sheet(s) in workbook: [...]

📄 Processing sheet: "BundledHealthService"...
✓ Sheet "BundledHealthService" has 150 rows

... (processing all sheets)

✅ Validation complete!
   Total Rows: 1015
   Valid Rows: 1008
   Errors: 7
   Warnings: 27
```

### **Import Mode:**
```
📊 Found 5 sheet(s) in workbook: [...]

📄 Processing sheet: "BundledHealthService"...
✓ Sheet "BundledHealthService" has 150 rows
(actually importing data...)

✅ Import complete! Processed 5 sheet(s)
```

---

## 🧪 **Testing:**

### **Test 1: Valid File**
1. Upload file with all required fields
2. Validate: `validateOnly=true`
3. Expected: `isValid: true`, `errorCount: 0`
4. Import: (omit validateOnly)
5. Expected: All rows imported

### **Test 2: File with Missing Codes**
1. Upload file with 5 rows missing `Code`
2. Validate: `validateOnly=true`
3. Expected: `isValid: false`, `errorCount: 5`
4. Fix Excel file
5. Re-validate: `isValid: true`
6. Import successfully

### **Test 3: File with Invalid Dates**
1. Upload file with corrupted dates
2. Validate: `validateOnly=true`
3. Expected: `isValid: true`, `warningCount: >0`
4. Can still import (dates will be null)

---

## 📊 **Benefits:**

### **1. No Surprises**
- Know exactly what will happen before importing
- See all issues upfront, not one at a time

### **2. Data Quality**
- Forces review of problematic data
- Encourages fixing at source (Excel) not database

### **3. Time Savings**
- Avoid failed imports
- Fix all issues in one go
- No database rollbacks needed

### **4. Better Debugging**
- Exact row and sheet numbers
- Clear error messages
- Easy to locate issues in Excel

---

## 🚀 **Future UI Enhancement:**

### **Proposed Two-Step Upload:**

```
[Upload & Validate] Button
    ↓
Shows validation results:
┌─────────────────────────────────────┐
│ ✅ Validation Complete              │
│                                     │
│ Total Rows: 1,015                   │
│ Valid Rows: 1,008                   │
│ Errors: 7 ❌                        │
│ Warnings: 27 ⚠️                     │
│                                     │
│ Issues Found:                       │
│ • Row 23 (Consultation): Missing Code │
│ • Row 23 (Consultation): Missing Name │
│ • Row 156 (DrugAndConsumables): ...  │
│                                     │
│ [Download Error Report]             │
│ [Fix & Re-Validate] [Import Anyway] │
└─────────────────────────────────────┘
```

---

## 🎯 **Summary:**

**Problem:** Import failures happened without warning, data got skipped/transformed silently

**Solution:** Validation-only mode that:
- Checks data without importing
- Reports ALL issues upfront
- Allows fixing at source
- Enables confident imports

**Usage:**
```bash
# Step 1: Validate
POST /api/hmo/1/tariffs/import
  file: tariffs.xlsx
  hmoType: axa
  validateOnly: true

# Step 2: Fix Excel (if needed)

# Step 3: Import
POST /api/hmo/1/tariffs/import
  file: tariffs.xlsx
  hmoType: axa
```

**Result:** Clean, validated imports with no surprises! ✅

---

**Implemented:** December 4, 2025  
**File:** `apps/web/src/app/api/hmo/[id]/tariffs/import/route.ts`  
**Impact:** Better data quality, fewer import failures, improved user experience
