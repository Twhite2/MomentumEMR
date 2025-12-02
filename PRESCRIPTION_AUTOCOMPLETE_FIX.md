# Prescription Autocomplete Fix

## 🐛 **Issue**
Paracetamol exists in inventory but doesn't show up when typing in the prescription form.

---

## ✅ **Root Causes Found & Fixed**

### **Problem 1: API Not Filtering by Category**
**Issue:** The inventory API wasn't accepting `category` or `drugCategory` query parameters.

**Fix Applied:**
```typescript
// Added in /api/inventory route.ts (lines 15-16, 31-39)
const category = searchParams.get('category');
const drugCategory = searchParams.get('drugCategory');

// Filter by category if specified
if (category && category !== '') {
  where.category = category;
}

// Filter by drugCategory if specified
if (drugCategory && drugCategory !== '') {
  where.drugCategory = drugCategory;
}
```

---

### **Problem 2: Category Hardcoded to 'Other'**
**Issue:** API was returning `category: 'Other'` for all items instead of using the database value.

**Fix Applied:**
```typescript
// Changed from:
category: 'Other',

// Changed to:
category: item.category || 'Other', // Use actual category from database
```

---

### **Problem 3: Wrong Response Property Name**
**Issue:** API returned `items` but prescription page expects `inventory`.

**Fix Applied:**
```typescript
return apiResponse({
  items: itemsWithStatus,
  inventory: itemsWithStatus, // Added for prescription page compatibility
  pagination: { ... },
});
```

---

## 🔍 **How Prescription Autocomplete Works**

### **Step 1: Prescription Page Makes Request**
```typescript
// From prescriptions/new/page.tsx (line 84-94)
const { data: inventoryData } = useQuery({
  queryKey: ['inventory-medications', selectedCategory],
  queryFn: async () => {
    const params = new URLSearchParams({
      category: 'Medication',  // ← FILTERS FOR MEDICATIONS ONLY
      limit: '100',
    });
    if (selectedCategory) {
      params.append('drugCategory', selectedCategory); // e.g., "Analgesic"
    }
    const response = await axios.get(`/api/inventory?${params}`);
    return response.data;
  },
});
```

### **Step 2: User Types in Drug Name**
```typescript
// From prescriptions/new/page.tsx (line 165-172)
const getFilteredInventory = (searchQuery: string) => {
  if (!searchQuery || !inventoryData?.inventory) return [];
  const query = searchQuery.toLowerCase();
  return inventoryData.inventory.filter(item => 
    item.itemName.toLowerCase().includes(query) ||
    item.drugCategory?.toLowerCase().includes(query)
  ).slice(0, 10); // Limit to 10 suggestions
};
```

### **Step 3: Autocomplete Shows Matches**
When you type "par", it searches for items where:
- `itemName` contains "par" (case-insensitive), OR
- `drugCategory` contains "par" (case-insensitive)

---

## ⚠️ **CRITICAL: Check Your Paracetamol Inventory Item**

For paracetamol to show up in prescriptions, it **MUST** have:

```
category = "Medication"  ← THIS IS REQUIRED!
```

### **Database Fields (from schema.prisma):**
```typescript
model Inventory {
  itemName       String    // e.g., "Paracetamol"
  category       String?   // MUST BE: "Medication"
  drugCategory   String?   // e.g., "Analgesic", "Antimalarial", etc.
  dosageForm     String?   // e.g., "Tablet", "Capsule", "Syrup"
  dosageStrength String?   // e.g., "500mg", "250mg/5ml"
  // ... other fields
}
```

---

## 🔧 **How to Fix Your Paracetamol Item**

### **Option 1: Update via Database**
```sql
UPDATE inventory 
SET category = 'Medication',
    drug_category = 'Analgesic',
    dosage_form = 'Tablet',
    dosage_strength = '500mg'
WHERE item_name ILIKE '%paracetamol%';
```

### **Option 2: Update via Inventory Page**
1. Go to Inventory page
2. Find paracetamol
3. Edit the item
4. Set:
   - **Category:** `Medication` (REQUIRED)
   - **Drug Category:** `Analgesic` (optional but recommended)
   - **Dosage Form:** `Tablet` (optional)
   - **Dosage Strength:** `500mg` (optional)
5. Save

---

## 🧪 **Testing After Fix**

### **Test 1: Basic Search**
1. Go to Create Prescription page
2. Type "par" in Drug Name field
3. ✅ Should see: Paracetamol in dropdown

### **Test 2: Category Filter**
1. On Create Prescription page
2. Select "Analgesic" from category dropdown (if you set drugCategory)
3. Type "par" in Drug Name field
4. ✅ Should see: Only analgesics including Paracetamol

### **Test 3: Auto-populate**
1. Type "par" and select Paracetamol from dropdown
2. ✅ Should auto-fill:
   - Drug Name: Paracetamol
   - Dosage: 500mg (if set in inventory)

---

## 📋 **Valid Category Values**

Based on schema, `category` can be:
- ✅ `"Medication"` ← Use this for drugs
- `"Supply"` - Medical supplies
- `"Equipment"` - Medical equipment
- `"Lab"` - Lab reagents/supplies
- `"Nursing"` - Nursing supplies

---

## 📋 **Valid Drug Category Values**

Based on prescription page, `drugCategory` can be:
- `"Antimalarial"`
- `"Antibiotic"`
- `"Analgesic"` ← Use this for Paracetamol
- `"Antihypertensive"`
- `"Antidiabetic"`
- `"Antihistamine"`
- `"Antacid"`
- `"Vitamin"`
- `"Other"`

---

## 🎯 **Expected Behavior After Fix**

### **When category = "Medication":**
```
User types: "par"
↓
API filters: WHERE category = 'Medication' AND itemName ILIKE '%par%'
↓
Returns: Paracetamol (and any other drugs with "par" in name)
↓
Prescription page shows: Dropdown with Paracetamol
```

### **When category ≠ "Medication":**
```
User types: "par"
↓
API filters: WHERE category = 'Medication' AND itemName ILIKE '%par%'
↓
Returns: Nothing (paracetamol filtered out because wrong category)
↓
Prescription page shows: "No medications found"
```

---

## 📝 **Files Modified**

1. ✅ `apps/web/src/app/api/inventory/route.ts`
   - Added category and drugCategory filtering (lines 15-16, 31-39)
   - Fixed category to use database value (line 82)
   - Added inventory property to response (line 95)

---

## 🚀 **Next Steps**

1. ✅ **API fixes are complete** (just deployed)
2. ⚠️ **Update paracetamol inventory item** to set `category = "Medication"`
3. ✅ **Test** by typing "par" in prescription form
4. ✅ **Verify** paracetamol appears in dropdown

---

## 💡 **Pro Tips**

### **For Better Autocomplete:**
- Set `drugCategory` for all medications (enables category filtering)
- Set `dosageStrength` (auto-fills dosage field)
- Set `dosageForm` (helps doctors identify the right form)

### **Example: Complete Paracetamol Entry**
```
itemName:       "Paracetamol"
category:       "Medication"      ← REQUIRED for prescription
drugCategory:   "Analgesic"       ← Enables category filter
dosageForm:     "Tablet"          ← Shows in autocomplete
dosageStrength: "500mg"           ← Auto-fills dosage
stockQuantity:  1000
unitPrice:      50.00
```

---

## 🎉 **Summary**

**What Was Broken:**
- ❌ API ignored category filters
- ❌ API hardcoded category to "Other"
- ❌ API returned wrong property name

**What's Fixed:**
- ✅ API now filters by category and drugCategory
- ✅ API uses actual category from database
- ✅ API returns both `items` and `inventory` properties

**What You Need to Do:**
- ⚠️ Update paracetamol: set `category = "Medication"`
- ✅ Test prescription autocomplete

---

**Status:** API FIX DEPLOYED ✅  
**Action Required:** Update inventory item category  
**Expected Result:** Paracetamol will appear when typing "par"
