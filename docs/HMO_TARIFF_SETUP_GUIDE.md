# HMO Tariff System - Setup Guide

## ✅ **System Status: READY**

### **Database**: ✅ Migrated
- `hmo_tariffs` table created
- Prisma Client generated

### **API Endpoints**: ✅ Created
- Import endpoint ready
- Query endpoint ready
- Delete endpoint ready

### **Frontend Page**: ✅ Created
- Location: `/hmo/[id]/tariffs`
- Full-featured tariff management UI

---

## 🚀 **How to Import HMO Tariffs**

### **Option 1: Using the Frontend UI (Recommended)**

1. **Navigate to the HMO Tariff Page**
   ```
   http://localhost:3000/hmo/1/tariffs
   ```
   (Replace `1` with the actual HMO ID)

2. **Import Reliance HMO Tariff**
   - Click "Choose File"
   - Select: `Reliance Tariff.xlsx`
   - Select HMO Type: **Reliance HMO (Tiered Drug Pricing)**
   - Click "Import Tariffs"
   - ✅ Wait for success message

3. **Import Leadway Provider Network**
   - Click "Choose File"
   - Select: `Leadway Provider Network.xlsx`
   - Select HMO Type: **Leadway Provider Network (Procedure Codes)**
   - Click "Import Tariffs"
   - ✅ Wait for success message

4. **Import AXA Mansard Tariff**
   - Click "Choose File"
   - Select: `Axa Mansard Tariff.xlsx`
   - Select HMO Type: **AXA Mansard (Service Packages)**
   - Click "Import Tariffs"
   - ✅ Wait for success message

---

### **Option 2: Using Postman/Thunder Client**

**Import Reliance:**
```
POST http://localhost:3000/api/hmo/1/tariffs/import
Content-Type: multipart/form-data

Body (form-data):
- file: [Select Reliance Tariff.xlsx]
- hmoType: reliance
```

**Import Leadway:**
```
POST http://localhost:3000/api/hmo/1/tariffs/import
Content-Type: multipart/form-data

Body (form-data):
- file: [Select Leadway Provider Network.xlsx]
- hmoType: leadway
```

**Import AXA:**
```
POST http://localhost:3000/api/hmo/1/tariffs/import
Content-Type: multipart/form-data

Body (form-data):
- file: [Select Axa Mansard Tariff.xlsx]
- hmoType: axa
```

---

## 📊 **Frontend Page Features**

### **1. Import Section**
- File upload with drag-and-drop support
- HMO type selector (Reliance/Leadway/AXA)
- Format guide for each HMO type
- Real-time import progress
- Success/error notifications

### **2. Search & Filter**
- Search by name or code
- Filter by category (Medication, Procedure, Package)
- Pagination support
- Results count display

### **3. Tariffs Table**
- Code, Name, Category, Unit
- Price display (with tier info for Reliance)
- Pre-authorization flag
- Sortable columns
- Hover effects

### **4. Actions**
- Clear all tariffs (with confirmation)
- Export to Excel (future)
- Edit individual tariff (future)

---

## 🎯 **Using Tariffs in Claims/Billing**

### **Example 1: Look up a tariff during billing**
```typescript
const tariff = await prisma.hmoTariff.findFirst({
  where: {
    hmoId: patient.hmoId,
    code: serviceCode, // e.g., "REL-1" or "10100001"
    active: true,
  },
});

// Use tariff data
const billingItem = {
  serviceCode: tariff.code,
  serviceName: tariff.name,
  unitPrice: tariff.basePrice, // or tier1Price, tier2Price, etc.
  isPARequired: tariff.isPARequired,
};
```

### **Example 2: Select price tier for Reliance HMO**
```typescript
// Get patient's tier from their HMO plan
const patientTier = patient.hmoPlan.tier || 0; // 0-4

// Select appropriate tier price
const price = tariff[`tier${patientTier}Price`] || tariff.basePrice;
```

### **Example 3: Check if Pre-Authorization is required**
```typescript
if (tariff.isPARequired) {
  // Show PA input field
  // Validate PA code before proceeding
  // Store PA code in encounter.authorizationCode
}
```

### **Example 4: Search tariffs in real-time**
```typescript
// In your billing form
const { data } = useQuery({
  queryKey: ['tariff-search', hmoId, searchTerm],
  queryFn: async () => {
    const response = await fetch(
      `/api/hmo/${hmoId}/tariffs?search=${searchTerm}&limit=10`
    );
    return response.json();
  },
  enabled: searchTerm.length > 2, // Only search after 3 characters
});

// Display results as autocomplete dropdown
```

---

## 📁 **File Locations**

### **Database**
```
packages/database/prisma/schema.prisma
  └── HmoTariff model (lines 1262-1292)
```

### **API Endpoints**
```
apps/web/src/app/api/hmo/[id]/tariffs/
  ├── import/route.ts  (Import tariffs)
  └── route.ts         (Query & delete tariffs)
```

### **Frontend Page**
```
apps/web/src/app/(protected)/hmo/[id]/tariffs/page.tsx
```

### **Excel Files**
```
drive-download-20250926T082524Z-1-001/
  ├── Reliance Tariff.xlsx
  ├── Leadway Provider Network.xlsx
  └── Axa Mansard Tariff.xlsx
```

---

## 🔍 **Data Structure Examples**

### **Reliance HMO (Tiered Medication Pricing)**
```json
{
  "code": "REL-1",
  "name": "PARACETAMOL TABLET - 500MG",
  "category": "Medication",
  "unit": "Tab/500mg",
  "basePrice": 378.00,
  "tier0Price": 378.00,
  "tier1Price": 277.20,
  "tier2Price": 239.40,
  "tier3Price": 201.60,
  "tier4Price": 176.40,
  "isPARequired": false
}
```

### **Leadway (Procedure Codes)**
```json
{
  "code": "10100001",
  "name": "APPLICATION OF COLLAR CUFF SLING",
  "category": "Procedure",
  "basePrice": 15000.00,
  "isPARequired": false
}
```

### **AXA Mansard (Service Packages)**
```json
{
  "code": "Pack0001",
  "name": "Annual Medical Check Up Female Above 30 years - Bronze Plan",
  "category": "Health Check and wellness",
  "basePrice": 0.00,
  "isPARequired": true,
  "effectiveDate": "2023-11-27T00:00:00.000Z"
}
```

---

## 🎨 **Frontend UI Screenshots**

The tariff management page includes:

1. **Header Section**
   - HMO name and description
   - Back button to HMO list

2. **Import Section** (Blue card)
   - File upload input
   - HMO type dropdown
   - Format guide box with examples
   - Import button
   - Clear all button (red)

3. **Search Section** (White card)
   - Search input (name/code)
   - Category filter dropdown
   - Results counter

4. **Tariffs Table** (Responsive)
   - Sortable columns
   - Hover effects
   - Tier pricing display
   - PA badge (Yellow=Yes, Green=No)

---

## 🚨 **Important Notes**

1. **Authentication Required**: All API endpoints require authentication (super_admin or admin role)

2. **File Format**: Excel files must match the expected format for each HMO type

3. **Upsert Logic**: Importing the same file twice will update existing tariffs (not duplicate)

4. **Unique Constraint**: Each tariff is unique by `(hmoId, code)` combination

5. **Price Parsing**: The system automatically handles currency symbols and commas

6. **Error Handling**: Import errors are collected and returned in the response

---

## 🎯 **Next Steps**

### **Immediate:**
1. ✅ Navigate to `/hmo/[id]/tariffs`
2. ✅ Import the 3 Excel files
3. ✅ Verify imports in the table

### **Integration:**
1. Add tariff lookup in billing form
2. Display tariff info when selecting services
3. Auto-populate prices from tariffs
4. Add PA check before submitting claims
5. Validate billing amounts against tariffs

### **Future Enhancements:**
1. Bulk edit tariffs
2. Export tariffs to Excel
3. Tariff versioning/history
4. Price comparison across HMOs
5. Tariff expiry notifications
6. Custom tariff adjustments

---

## 📞 **Support**

For questions or issues:
- Check `HMO_TARIFF_IMPLEMENTATION.md` for detailed API docs
- Review the Prisma schema for data model details
- Test endpoints with Postman/Thunder Client
- Check browser console for frontend errors

---

**System is ready! Navigate to the tariff page and start importing.** 🎉
