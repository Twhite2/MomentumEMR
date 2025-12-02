# 📍 **Where to Find All Inventory Fields**

## ✅ **Now Fully Implemented!**

All the pharmaceutical tracking fields you requested are now in the inventory forms!

---

## 📋 **Fields in Inventory Form:**

### **1. Medication Details Section:**
```
Drug Name: e.g., "Paracetamol Tablet"
Category: Medication / Supply / Equipment / Lab / Nursing
Drug Category: Antimalarial / Antibiotic / Analgesic / etc.
Dosage Form: Tablet / Syrup / Injection ← DOSAGE INFO
Dosage Strength: 500mg / 250mg/5ml  ← DOSAGE INFO
Manufacturer: Pfizer / etc.
```

### **2. Stock Information Section:**

#### **Package Configuration:**
```
Packaging Unit: [Dropdown]
  - Tablet/Capsule
  - Blister Pack
  - Strip
  - Bottle
  - Box
  - Vial/Ampoule
  - Sachet

Units per Package: e.g., "10" tablets per blister

Initial Stock: e.g., "50" packages
```

#### **Real-Time Calculator:**
```
┌─────────────────────────────────────┐
│ Total Units in Stock                │
│ 50 blister_packs × 10 units each   │
│          500 units                  │
└─────────────────────────────────────┘
```

#### **Pricing (Per Tablet/Unit):**
```
Unit Price (₦ per tablet): e.g., ₦50.00
Corporate Price (₦ per tablet): e.g., ₦45.00
Reorder Level (Packages): e.g., 10
```

---

## 📸 **How It Looks:**

### **When you navigate to `/inventory/new`:**

```
Medication Details
├─ Drug Name: [Paracetamol Tablet]
├─ Category: [Medication ▼]
├─ Drug Category: [Analgesic ▼]
├─ Dosage Form: [Tablet]        ← Dosage info
├─ Dosage Strength: [500mg]     ← Dosage info
└─ Manufacturer: [Pfizer]

Stock Information
├─ Packaging Unit: [Blister Pack ▼]
├─ Units per Package: [10] tablets
├─ Initial Stock: [50] packages
│
├─ 📊 Total Units: 500 tablets  ← Auto-calculated!
│
├─ Unit Price: ₦[50.00] per tablet
├─ Corporate Price: ₦[45.00] per tablet
└─ Reorder Level: [10] packages

Batch Information
├─ Batch Number: [BATCH-2024-001]
└─ Expiry Date: [mm/dd/yyyy]
```

---

## 🔄 **How It Works End-to-End:**

### **Step 1: Add to Inventory**
```
Navigate to: /inventory/new

Fill in:
✓ Drug: Paracetamol Tablet
✓ Dosage Strength: 500mg
✓ Dosage Form: Tablet
✓ Packaging: Blister Pack (10 tablets each)
✓ Stock: 50 packages
✓ Price: ₦50/tablet (Self-pay)
✓ Price: ₦45/tablet (Corporate)

Save → System calculates: 500 total tablets
```

### **Step 2: Doctor Prescribes** (Uses your inventory)
```
Doctor selects: Paracetamol 500mg (from inventory)
Enters:
  Dosage: 1 tablet
  Frequency: 3 times daily
  Duration: 7 days

System auto-calculates:
  Total tablets: 1 × 3 × 7 = 21 tablets
  Packages needed: 3 blister packs
  Cost: 21 × ₦50 = ₦1,050
```

### **Step 3: Pharmacist Dispenses**
```
Reviews prescription
Confirms stock available (50 packages ✓)
Clicks "Dispense"

System automatically:
  ✓ Deducts 3 packages (50 → 47)
  ✓ Deducts 30 tablets (500 → 470)
  ✓ Creates invoice (₦1,050)
  ✓ Updates prescription status
```

---

## 🎯 **Key Features:**

### **Dosage Information:**
✅ **Dosage Strength** field shows: "500mg", "250mg/5ml", etc.
✅ **Dosage Form** field shows: "Tablet", "Syrup", "Injection"
✅ Stored in inventory for each drug

### **Package Tracking:**
✅ **Packaging Unit** dropdown: Blister Pack, Bottle, Strip, etc.
✅ **Units per Package**: How many tablets/units in each package
✅ **Stock Quantity**: Number of packages (not individual tablets)
✅ **Total Units**: Auto-calculated (packages × units per package)

### **Multi-Tier Pricing:**
✅ **Unit Price**: Per-tablet price for self-pay patients
✅ **Corporate Price**: Per-tablet price for corporate patients
✅ **HMO Price**: From HMO tariff system (already exists)

---

## 📂 **Where to Access:**

### **To Add New Medication:**
```
Navigation: Inventory → Add Medication
URL: /inventory/new
File: apps/web/src/app/(protected)/inventory/new/page.tsx
```

### **To Edit Existing Medication:**
```
Navigation: Inventory → [Select Drug] → Edit
URL: /inventory/[id]/edit
File: apps/web/src/app/(protected)/inventory/[id]/edit/page.tsx
```

### **To View Inventory List:**
```
Navigation: Inventory
URL: /inventory
Shows: All medications with stock levels
```

---

## 💡 **Example Entry:**

```
Drug Name: Paracetamol Tablet
Dosage Strength: 500mg          ← Shows dosage
Dosage Form: Tablet              ← Shows dosage type
Packaging Unit: Blister Pack
Units per Package: 10 tablets
Stock: 50 packages = 500 tablets ← Auto-calculated
Unit Price: ₦50 per tablet
Corporate Price: ₦45 per tablet
```

---

## 🚀 **What's Already Working:**

✅ Inventory form has ALL fields  
✅ Dosage strength & form captured  
✅ Package tracking implemented  
✅ Per-tablet pricing set up  
✅ Total tablets auto-calculated  
✅ Prescription uses this data  
✅ Dispensing deducts correctly  
✅ Invoice created automatically  

---

## 📝 **Database Fields:**

All data is stored in the `inventory` table:

```sql
inventory {
  itemName: "Paracetamol Tablet"
  dosageStrength: "500mg"        ← Dosage info
  dosageForm: "Tablet"            ← Dosage info
  packagingUnit: "blister_pack"
  tabletsPerPackage: 10
  stockQuantity: 50               ← Packages
  unitPrice: 50.00                ← Per tablet
  corporatePrice: 45.00           ← Per tablet
  hmoPrice: null                  ← From tariff
}
```

---

## 🎉 **Everything is Ready!**

Just navigate to `/inventory/new` and you'll see all the fields!

**Status:** ✅ Complete and working!
