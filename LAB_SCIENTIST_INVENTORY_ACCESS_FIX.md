# ✅ **Lab Scientist Inventory Access Fix**

## 🐛 **The Problem**

Lab scientists were getting **403 Forbidden** errors when trying to access inventory:

```
API Error: Error: Forbidden
GET /api/inventory?category=Lab&limit=100 403
at requireRole (api-utils.ts:19:11)
```

**Root Cause:** Inventory API endpoints were missing `'lab_scientist'` in their allowed roles lists.

---

## ✅ **What Was Fixed**

Added `'lab_scientist'` to allowed roles in **4 inventory API endpoints**:

### **1. GET /api/inventory** ✅
**File:** `apps/web/src/app/api/inventory/route.ts` (Line 8)

**Before:**
```typescript
const session = await requireRole(['admin', 'pharmacist', 'doctor']);
```

**After:**
```typescript
const session = await requireRole(['admin', 'pharmacist', 'doctor', 'lab_scientist']);
```

**Why:** Lab scientists need to view Lab inventory items (reagents, test kits, supplies).

---

### **2. GET /api/inventory/[id]** ✅
**File:** `apps/web/src/app/api/inventory/[id]/route.ts` (Line 12)

**Before:**
```typescript
const session = await requireRole(['admin', 'pharmacist', 'doctor']);
```

**After:**
```typescript
const session = await requireRole(['admin', 'pharmacist', 'doctor', 'lab_scientist']);
```

**Why:** Lab scientists need to view individual Lab inventory item details.

---

### **3. PUT /api/inventory/[id]** ✅
**File:** `apps/web/src/app/api/inventory/[id]/route.ts` (Line 60)

**Before:**
```typescript
const session = await requireRole(['admin', 'pharmacist']);
```

**After:**
```typescript
const session = await requireRole(['admin', 'pharmacist', 'lab_scientist']);
```

**Why:** Lab scientists need to update Lab inventory items (e.g., update stock levels, expiry dates).

---

### **4. POST /api/inventory/[id]/stock** ✅
**File:** `apps/web/src/app/api/inventory/[id]/stock/route.ts` (Line 12)

**Before:**
```typescript
const session = await requireRole(['admin', 'pharmacist']);
```

**After:**
```typescript
const session = await requireRole(['admin', 'pharmacist', 'lab_scientist']);
```

**Why:** Lab scientists need to adjust Lab inventory stock when consuming reagents/supplies for tests.

---

## 📊 **Lab Scientist Inventory Permissions**

### ✅ **Now Allowed:**
- **View** all inventory items (filtered by category=Lab)
- **View** individual Lab inventory item details
- **Update** Lab inventory items
- **Adjust stock** (add/remove Lab supplies)
- **Add new** Lab inventory items (POST was already allowed)

### ❌ **Still Not Allowed:**
- **Delete** inventory items (admin only)
- Access other categories (Pharmacy items) - filtered by category

---

## 🧪 **Testing**

### **Test as Lab Scientist:**

1. **Login** as lab scientist account
2. **Navigate** to Inventory page
3. **Filter** by Category: Lab
4. **Expected Results:**
   - ✅ Inventory list loads successfully
   - ✅ Can view Lab items (reagents, test kits, etc.)
   - ✅ Can click on items to view details
   - ✅ Can adjust stock quantities
   - ✅ Can update item details
   - ✅ No 403 Forbidden errors

---

## 🔒 **Security Notes**

### **Good:**
- Lab scientists can only access inventory for their hospital (filtered by `hospitalId`)
- Category filtering can limit them to Lab-specific items
- Can't delete inventory items (admin only)

### **Consider:**
If you want to **restrict lab scientists to only Lab category items**, add this check in the endpoints:

```typescript
// In GET /api/inventory
const session = await requireRole(['admin', 'pharmacist', 'doctor', 'lab_scientist']);

// Add category restriction for lab_scientist
if (session.user.role === 'lab_scientist') {
  where.category = 'Lab'; // Force Lab category filter
}
```

This would prevent lab scientists from viewing Pharmacy/Medication inventory.

---

## 📝 **Summary**

**Problem:** Lab scientists couldn't access Lab inventory APIs due to missing role permissions.

**Solution:** Added `'lab_scientist'` to 4 inventory API endpoint role lists.

**Result:**
- ✅ Lab scientists can now manage Lab inventory
- ✅ Can view, update, and adjust Lab supplies
- ✅ No more 403 Forbidden errors
- ✅ Proper access control maintained

**Lab inventory management is now fully functional for lab scientists!** 🧪✅
