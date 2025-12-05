# ✅ **Claims Management - HMO Invoices Integration**

## 🎯 **Changes Overview:**

Updated the Claims Management page to display **all HMO invoices** instead of claim submissions, with proper filtering by HMO and status.

---

## 🔄 **What Changed:**

### **1. Claims API Updated**

**File:** `apps/web/src/app/api/claims/route.ts`

**Before:**
- Fetched from `ClaimSubmission` table
- Required claim batches
- Limited to submitted claims only

**After:**
- Fetches from `Invoice` table
- Filters invoices with `hmoId` (HMO patients only)
- Shows all HMO invoices automatically

**New Query Logic:**
```typescript
const where: any = {
  hospitalId,
  hmoId: { not: null }, // Only HMO invoices
};

if (status) where.status = status;
if (hmoId) where.hmoId = parseInt(hmoId);
```

---

### **2. Claims Page Updated**

**File:** `apps/web/src/app/(protected)/claims/page.tsx`

**Updated Interface:**
```typescript
interface Claim {
  id: number;
  invoiceId: number;
  status: string;
  submittedAmount: number;
  paidAmount: number | null;
  submissionDate: string;
  hmoId: number | null;
  hmo?: { id: number; name: string; provider?: string };
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    patientType: string;
  };
  invoiceItems: any[];
  totalAmount: number;
  notes: string | null;
}
```

**New Table Columns:**
1. **Invoice #** - Shows invoice ID (e.g., INV-000123)
2. **Patient** - Patient name and ID
3. **HMO** - HMO name from patient's insurance
4. **Status** - Invoice status (paid, pending, etc.)
5. **Amount** - Total invoice amount
6. **Paid** - Amount paid by HMO
7. **Date** - Invoice creation date
8. **Actions** - Update status button

---

## 📊 **How It Works:**

### **Automatic HMO Invoice Display:**

1. **When Invoice is Created:**
   ```
   - Patient with HMO selected
   - Invoice created with hmoId
   - Automatically appears in Claims Management
   ```

2. **Claims Management Shows:**
   ```
   - All invoices where patient has HMO
   - Real-time status tracking
   - Filterable by HMO provider
   - Filterable by invoice status
   ```

3. **Workflow:**
   ```
   Create Invoice (HMO Patient)
   ↓
   Invoice saved with HMO details
   ↓
   Appears in Claims Management
   ↓
   Can filter by Status/HMO
   ↓
   Track payment from HMO
   ```

---

## 🎨 **UI Features:**

### **Filters:**

1. **Status Filter:**
   - All Statuses
   - Submitted
   - Processing
   - Paid
   - Partially Paid
   - Denied
   - Disputed
   - Outstanding
   - Queried

2. **HMO Filter:**
   - All HMOs (default)
   - Lists all HMOs from hospital
   - Example: Leadway HMO, AXA Mansard, Reliance HMO
   - Dynamically populated

3. **Clear Filters Button:**
   - Resets all filters
   - Shows all HMO invoices

---

## 📋 **Table Display:**

### **Invoice Information:**

```
┌─────────────┬──────────────┬─────────────┬─────────┬──────────┬─────────┬────────────┬─────────┐
│ Invoice #   │ Patient      │ HMO         │ Status  │ Amount   │ Paid    │ Date       │ Actions │
├─────────────┼──────────────┼─────────────┼─────────┼──────────┼─────────┼────────────┼─────────┤
│ INV-000123  │ John Doe     │ Leadway HMO │ PENDING │ ₦25,000  │ ₦0      │ Dec 5, 2025│ Update  │
│ 2 item(s)   │ P-000045     │             │         │          │         │            │         │
├─────────────┼──────────────┼─────────────┼─────────┼──────────┼─────────┼────────────┼─────────┤
│ INV-000124  │ Jane Smith   │ AXA Mansard │ PAID    │ ₦50,000  │ ₦50,000 │ Dec 4, 2025│ Update  │
│ 3 item(s)   │ P-000078     │             │         │          │         │            │         │
└─────────────┴──────────────┴─────────────┴─────────┴──────────┴─────────┴────────────┴─────────┘
```

---

## 🔍 **Filtering Examples:**

### **Example 1: View Leadway HMO Claims**
```
1. Click HMO dropdown
2. Select "Leadway HMO"
3. Shows only Leadway invoices
4. Can further filter by status
```

### **Example 2: View Pending Claims**
```
1. Click Status dropdown
2. Select "Pending"
3. Shows all unpaid HMO invoices
4. Across all HMOs
```

### **Example 3: Leadway Pending Claims**
```
1. HMO: "Leadway HMO"
2. Status: "Pending"
3. Shows: Leadway invoices awaiting payment
```

---

## 🎯 **Status Colors:**

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| **Paid** | Green | ✓ | HMO payment received |
| **Pending** | Blue | ⏱ | Awaiting HMO payment |
| **Denied** | Red | ✗ | Claim denied by HMO |
| **Disputed** | Orange | ⚠ | Under dispute |
| **Queried** | Purple | ⚠ | HMO requesting info |
| **Outstanding** | Light Blue | ⏱ | Overdue payment |
| **Processing** | Blue | ⏱ | HMO processing claim |

---

## 💾 **Data Flow:**

### **From Invoice Creation to Claims:**

```
┌────────────────────────┐
│ 1. Create Invoice      │
│    - Select HMO patient│
│    - Add HMO items     │
│    - Enter PA code     │
│    - Set agreed price  │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ 2. Save to Database    │
│    - Invoice table     │
│    - hmoId saved       │
│    - Status: pending   │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ 3. Claims Management   │
│    - Auto-appears      │
│    - Filterable by HMO │
│    - Track status      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ 4. Update Status       │
│    - Mark as paid      │
│    - Record amount     │
│    - Add notes         │
└────────────────────────┘
```

---

## 🧪 **Testing:**

### **Test Case 1: Create HMO Invoice**
```
1. Go to Invoices → New
2. Select HMO patient (e.g., John with Leadway HMO)
3. Add items with HMO coverage
4. Enter PA code
5. Submit invoice
6. Go to Claims Management
7. Verify: Invoice appears in list
8. Verify: HMO shows as "Leadway HMO"
```

### **Test Case 2: Filter by HMO**
```
1. Create invoices for different HMOs:
   - 2 Leadway invoices
   - 3 AXA invoices
   - 1 Reliance invoice
2. Go to Claims Management
3. Select HMO filter: "Leadway HMO"
4. Verify: Only 2 Leadway invoices shown
5. Select "AXA Mansard"
6. Verify: Only 3 AXA invoices shown
```

### **Test Case 3: Filter by Status**
```
1. Create invoices with different statuses
2. Go to Claims Management
3. Select Status: "Pending"
4. Verify: Only pending invoices shown
5. Select Status: "Paid"
6. Verify: Only paid invoices shown
```

### **Test Case 4: Combined Filters**
```
1. HMO: "Leadway HMO"
2. Status: "Pending"
3. Verify: Only Leadway pending invoices shown
4. Clear filters
5. Verify: All HMO invoices shown
```

---

## 📊 **API Response Format:**

### **GET /api/claims**

**Response:**
```json
{
  "claims": [
    {
      "id": 123,
      "invoiceId": 123,
      "status": "pending",
      "submittedAmount": 25000,
      "paidAmount": 0,
      "submissionDate": "2025-12-05T08:00:00Z",
      "hmoId": 2,
      "patient": {
        "id": 45,
        "firstName": "John",
        "lastName": "Doe",
        "patientType": "hmo"
      },
      "hmo": {
        "id": 2,
        "name": "Leadway HMO",
        "provider": "Leadway"
      },
      "invoiceItems": [
        {
          "id": 456,
          "description": "Consultation",
          "quantity": 1,
          "unitPrice": 25000,
          "amount": 25000
        }
      ],
      "totalAmount": 25000,
      "notes": null
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

## 🎯 **Benefits:**

### **For Hospital Staff:**
- ✅ All HMO invoices in one place
- ✅ Easy filtering by HMO provider
- ✅ Real-time status tracking
- ✅ No manual claim submission needed
- ✅ Automatic population from invoices

### **For Claims Team:**
- ✅ See all pending HMO payments
- ✅ Filter by specific HMO
- ✅ Track payment status
- ✅ Update claim status easily
- ✅ Add notes for follow-up

### **For Management:**
- ✅ Overview of all HMO invoices
- ✅ Track outstanding payments per HMO
- ✅ Identify delayed payments
- ✅ Monitor HMO relationships
- ✅ Financial reporting

---

## 📝 **Files Modified:**

### **1. API Route:**
**File:** `apps/web/src/app/api/claims/route.ts`

**Changes:**
- Changed from `ClaimSubmission` to `Invoice` table
- Added filter for `hmoId: { not: null }`
- Included patient with HMO relationship
- Transform invoices to claims format

### **2. Claims Page:**
**File:** `apps/web/src/app/(protected)/claims/page.tsx`

**Changes:**
- Updated `Claim` interface
- Changed table columns
- Updated modal display
- Fixed HMO filter to show hospital HMOs

---

## 🚀 **Future Enhancements:**

### **Potential Additions:**

1. **Bulk Actions:**
   - Mark multiple as submitted
   - Export selected claims
   - Batch status updates

2. **PA Code Display:**
   - Show PA authorization codes
   - Link to HMO tariff details
   - Track PA expiration

3. **Payment Tracking:**
   - Expected payment date
   - Days outstanding
   - Payment reminders

4. **HMO Communication:**
   - Send claims to HMO email
   - Track submission status
   - Receive HMO responses

5. **Reports:**
   - Claims by HMO (monthly)
   - Outstanding payments report
   - Denial rate per HMO
   - Average payment time

---

## 💡 **Usage Tips:**

### **For Billing Staff:**

1. **Daily Workflow:**
   ```
   - Check "Pending" status
   - Contact HMOs for payment
   - Update status when paid
   - Add notes on follow-ups
   ```

2. **Weekly Review:**
   ```
   - Filter by each HMO
   - Check outstanding amounts
   - Follow up on old claims
   - Update disputed statuses
   ```

3. **Monthly Reconciliation:**
   ```
   - Filter by "Paid" status
   - Match with bank deposits
   - Verify amounts received
   - Close reconciled claims
   ```

---

## 🎉 **Summary:**

**Problem:** Claims Management page was empty, not showing HMO invoices

**Solution:**
- Changed API to fetch invoices with HMO
- Updated UI to display invoice data
- Added HMO and status filters
- Included patient information

**Result:**
- ✅ All HMO invoices visible in Claims Management
- ✅ Filterable by HMO provider
- ✅ Filterable by invoice status
- ✅ Real-time tracking
- ✅ Easy status updates

---

**Updated:** December 5, 2025  
**Impact:** Claims Management now shows all HMO invoices with proper filtering  
**Backward Compatible:** Yes - existing functionality preserved
