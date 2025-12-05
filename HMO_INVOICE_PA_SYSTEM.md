# ✅ **HMO Invoice - Prior Authorization (PA) System**

## 🎯 **Changes Overview:**

Updated the HMO invoice system to use **Prior Authorization (PA) codes** instead of calculating the difference between inventory and HMO prices.

---

## 🔄 **What Changed:**

### **1. Optional Inventory Description for HMO Patients**

**Before:**
- Item Description was **required** for all patients
- Had to select from inventory even for HMO services

**After:**
- Item Description is **OPTIONAL** for HMO patients
- Only required if HMO Coverage is not selected
- Can create invoice using HMO tariff alone

**Label:** 
- HMO Patients: "Item Description (Optional)"
- Other Patients: "Item Description"

---

### **2. Prior Authorization (PA) Code Field**

**NEW FEATURE:**
- Added **PA Authorization Code** input field
- Shows for all HMO patients
- Used to link invoice to HMO approval
- Stored with invoice item

**Purpose:**
- HMO sends PA authorization code
- Hospital enters code in invoice
- Links service to pre-approved HMO agreement

---

### **3. New Pricing Logic for HMO**

#### **OLD System (Difference Calculation):**
```
Inventory Price:  ₦5,000  (Hospital charges)
HMO Coverage:     ₦600    (HMO says they pay)
Patient Pays:     ₦4,400  (Difference = ₦5,000 - ₦600)
```

#### **NEW System (PA Agreement):**
```
HMO Coverage:     Selected from HMO tariff
PA Auth Code:     ABC12345 (from HMO)
Agreed HMO Price: ₦25,000 (negotiated with HMO)
Invoice Amount:   ₦25,000 (HMO pays this amount)
```

**Key Difference:**
- **OLD:** Calculated patient payment as difference
- **NEW:** HMO pays the full agreed amount with PA code

---

## 📋 **How It Works:**

### **Workflow for HMO Patients:**

#### **Step 1: Select HMO Coverage**
```
1. Search HMO tariff (e.g., "Consultation")
2. Select procedure from dropdown
3. Shows HMO tariff code and base price
```

#### **Step 2: Enter PA Authorization Code**
```
1. HMO sends PA code (e.g., "PA-2025-001234")
2. Enter code in "PA Authorization Code" field
3. System links invoice to HMO authorization
```

#### **Step 3: Enter Agreed Price**
```
1. Hospital negotiates price with HMO
2. HMO approves amount (e.g., ₦25,000)
3. Enter agreed price in "Agreed HMO Price"
4. This becomes the invoice amount
```

#### **Step 4: Optional Inventory Link**
```
- Can also select inventory item (OPTIONAL)
- Useful for tracking stock usage
- Doesn't affect HMO pricing
```

---

## 🎨 **UI Changes:**

### **For HMO Patients:**

**Invoice Item Fields:**

1. **Item Description (Optional)**
   - Label changes to show "(Optional)"
   - Placeholder: "Optional - Start typing to search inventory..."
   - Only required if no HMO Coverage selected

2. **HMO Coverage** (NEW layout)
   - Search HMO tariffs
   - Shows: Tariff name, code, category, HMO rate
   - Badge: "HMO Tariff Applied"

3. **PA Authorization Code** (NEW)
   - Input field for PA code
   - Placeholder: "Enter PA code from HMO..."
   - Help text: "Enter the Prior Authorization code from the HMO"

4. **Agreed HMO Price (₦)** (RENAMED)
   - Previously: "HMO Coverage (₦)"
   - Now: "Agreed HMO Price (₦)"
   - Help text shows PA code: "HMO pays this amount (PA: ABC12345)"

5. **Invoice Amount (₦)** (UPDATED)
   - Previously: "Patient Pays (₦)" with formula
   - Now: "Invoice Amount (₦)" 
   - Shows: "✓ HMO will pay this amount"

---

## 💾 **Data Structure:**

### **InvoiceItem Interface (Updated):**

```typescript
interface InvoiceItem {
  description: string;           // Optional for HMO if hmoTariffId exists
  quantity: string;
  unitPrice: string;             // Now equals hmoTariffPrice for HMO with PA
  amount: number;
  inventoryItemId?: number;      // Optional inventory link
  inventoryPrice?: number;       // Optional inventory tracking
  hmoTariffId?: number;          // Required for HMO invoices
  hmoTariffPrice?: number;       // Agreed price with HMO
  paAuthCode?: string;           // NEW: PA authorization code
  isManualPriceOverride?: boolean;
  isManualHMOOverride?: boolean;
}
```

---

## 🧮 **Pricing Calculation Logic:**

### **New `calculateFinalPrice` Function:**

```typescript
const calculateFinalPrice = (item: InvoiceItem): number => {
  // For HMO patients with PA authorization code
  if (item.paAuthCode && item.hmoTariffPrice) {
    return item.hmoTariffPrice; // HMO pays agreed price
  }
  
  // Otherwise use inventory price or manual price
  return item.inventoryPrice || parseFloat(item.unitPrice) || 0;
};
```

**Logic:**
1. **Has PA Code + HMO Price:** Return HMO agreed price
2. **No PA Code:** Return inventory price (if selected)
3. **No Inventory:** Return manual unit price

---

## 📊 **Example Scenarios:**

### **Scenario 1: HMO Service with PA**
```
✅ Select HMO Coverage: "Consultation - General"
✅ Enter PA Code: "PA-2025-001234"
✅ Agreed HMO Price: ₦25,000
✅ Quantity: 1
✅ Invoice Amount: ₦25,000 (HMO pays)
```

### **Scenario 2: HMO Service + Inventory Tracking**
```
✅ Select HMO Coverage: "Surgical Procedure"
✅ Select Inventory: "Paracetamol" (for tracking)
✅ Enter PA Code: "PA-2025-005678"
✅ Agreed HMO Price: ₦150,000
✅ Invoice Amount: ₦150,000 (HMO pays)
Note: Inventory item tracked separately, doesn't affect price
```

### **Scenario 3: HMO Tariff Only (No Inventory)**
```
✅ Item Description: Empty (optional!)
✅ Select HMO Coverage: "Laboratory Test - Full Blood Count"
✅ Enter PA Code: "PA-2025-009999"
✅ Agreed HMO Price: ₦5,000
✅ Invoice Amount: ₦5,000 (HMO pays)
```

---

## 🎯 **Benefits:**

### **For Hospital:**
- ✅ Clear record of HMO authorization
- ✅ Invoice matches HMO-approved amount
- ✅ Easier HMO claims processing
- ✅ Can track inventory separately (optional)
- ✅ No confusing "patient pays" calculations

### **For HMO:**
- ✅ PA code links invoice to authorization
- ✅ Agreed price is clearly documented
- ✅ No disputes about patient vs HMO payment
- ✅ Claims tied to pre-approval

### **For Billing Staff:**
- ✅ Simple workflow: Select tariff → Enter PA → Enter agreed price
- ✅ No complex calculations
- ✅ Clear what HMO will pay
- ✅ Inventory selection optional

---

## 🔍 **Validation Rules:**

### **For HMO Patients:**

1. **Item Description:**
   - Required IF no HMO tariff selected
   - Optional IF HMO tariff selected

2. **HMO Coverage:**
   - Optional but recommended
   - If selected, enables PA workflow

3. **PA Authorization Code:**
   - Optional field
   - If entered with HMO price, HMO pays that amount
   - Stored for reference and claims

4. **Agreed HMO Price:**
   - Required IF HMO tariff selected
   - Must be > 0
   - This becomes the invoice amount

---

## 📝 **Invoice Display:**

### **Invoice Item Summary:**

**With PA Authorization:**
```
Item: Consultation - General
PA Code: PA-2025-001234
HMO Tariff: Consultation (Code: CONS-001)
Agreed Price: ₦25,000 × 1
Amount: ₦25,000 ✓ HMO Pays
```

**Without PA (Old System):**
```
Item: Paracetamol
Quantity: 10
Unit Price: ₦50
Amount: ₦500
```

---

## 🧪 **Testing:**

### **Test Case 1: HMO Invoice with PA**
```
1. Select patient with HMO type
2. Click "Add Item"
3. Leave description empty
4. Search and select HMO Coverage
5. Enter PA code: TEST-PA-001
6. Enter agreed price: 50000
7. Submit invoice
8. Verify:
   ✅ Item has PA code
   ✅ Amount = 50000
   ✅ Description uses HMO tariff name
```

### **Test Case 2: HMO Invoice without PA**
```
1. Select patient with HMO type
2. Select inventory item (Paracetamol)
3. Select HMO Coverage
4. Don't enter PA code
5. Inventory price used instead
6. Verify:
   ✅ No PA code stored
   ✅ Amount = inventory price
```

### **Test Case 3: Mixed Items**
```
1. Item 1: HMO service with PA (₦25,000)
2. Item 2: Regular inventory item (₦5,000)
3. Item 3: HMO service without PA (₦10,000)
4. Total: ₦40,000
5. Verify each item priced correctly
```

---

## 🚀 **Migration Notes:**

### **Existing Invoices:**
- Old invoices remain unchanged
- No migration needed
- New field `paAuthCode` is optional
- Backward compatible

### **For Staff Training:**
- **Old way:** Select inventory → HMO deducts → Patient pays difference
- **New way:** Select HMO tariff → Enter PA → Enter agreed price → HMO pays

---

## 📋 **Files Modified:**

**File:** `apps/web/src/app/(protected)/invoices/new/page.tsx`

**Changes:**
1. ✅ Added `paAuthCode` field to `InvoiceItem` interface (Line 54)
2. ✅ Updated `calculateFinalPrice` to use PA logic (Lines 158-166)
3. ✅ Modified `handleHMOTariffSelect` to set description from tariff (Line 203)
4. ✅ Added `handlePACodeChange` function (Lines 256-272)
5. ✅ Made description optional for HMO patients (Line 438, 448)
6. ✅ Added PA Authorization Code input field (Lines 577-589)
7. ✅ Updated price breakdown UI for HMO patients (Lines 605-636)

---

## 🎉 **Summary:**

**Problem:** 
- Confusing price calculations (inventory - HMO coverage)
- Description required even for HMO-only services
- No way to track PA authorization codes

**Solution:**
- PA authorization code field
- HMO pays agreed price (not difference)
- Description optional for HMO patients
- Clear workflow: Tariff → PA Code → Agreed Price

**Result:**
- ✅ Clearer HMO invoicing
- ✅ PA codes tracked for claims
- ✅ Agreed prices documented
- ✅ Simpler for billing staff
- ✅ Better HMO integration

---

**Updated:** December 5, 2025  
**Impact:** HMO invoice creation now uses PA authorization system  
**Backward Compatible:** Yes - existing invoices unaffected
