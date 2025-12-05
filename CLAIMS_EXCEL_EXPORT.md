# ✅ **Claims Excel Export - HMO Submission**

## 🎯 **Feature Overview:**

Added Excel export functionality to Claims Management page to generate downloadable spreadsheets with all claim details for HMO submission.

---

## 📊 **Excel File Contents:**

### **Columns Included:**

1. **Invoice Number** - e.g., INV-000123
2. **Patient ID** - e.g., P-000045
3. **Patient Name** - Full name
4. **HMO Provider** - HMO name (e.g., Leadway HMO)
5. **HMO Provider Code** - Provider identifier
6. **Status** - PENDING, PAID, etc.
7. **Invoice Date** - Date of service
8. **Total Amount (NGN)** - Total invoice amount
9. **Amount Paid (NGN)** - Amount already paid
10. **Balance (NGN)** - Outstanding amount
11. **Number of Items** - Count of invoice items
12. **Invoice Items** - Detailed list of all items with quantities and prices
13. **Notes** - Additional information

---

## 🎨 **How to Use:**

### **Step 1: Filter Claims (Optional)**

```
1. Select HMO: "Leadway HMO" (or leave as "All HMOs")
2. Select Status: "Pending" (or leave as "All Statuses")
3. Filtered claims will be exported
```

### **Step 2: Click Export**

```
1. Click "Export to Excel" button (top-right)
2. File downloads automatically
3. Filename includes date and filters
```

### **Step 3: Share with HMO**

```
1. Open downloaded Excel file
2. Review data for accuracy
3. Send to HMO via email or upload to their portal
```

---

## 📁 **File Naming:**

### **Format:**

```
HMO_Claims_YYYY-MM-DD[_HMO_Name][_Status].xlsx
```

### **Examples:**

| Filters Applied | Filename |
|----------------|----------|
| None | `HMO_Claims_2025-12-05.xlsx` |
| Leadway HMO | `HMO_Claims_2025-12-05_Leadway_HMO.xlsx` |
| Status: Pending | `HMO_Claims_2025-12-05_pending.xlsx` |
| Leadway + Pending | `HMO_Claims_2025-12-05_Leadway_HMO_pending.xlsx` |

---

## 📋 **Excel Format Example:**

```
┌────────────┬────────────┬─────────────┬─────────────┬────────┬───────────┬──────────┬──────────┬─────────┬────────────────────────────┐
│ Invoice #  │ Patient ID │ Patient Name│ HMO         │ Status │ Date      │ Amount   │ Paid     │ Balance │ Invoice Items              │
├────────────┼────────────┼─────────────┼─────────────┼────────┼───────────┼──────────┼──────────┼─────────┼────────────────────────────┤
│ INV-000123 │ P-000045   │ John Doe    │ Leadway HMO │ PENDING│ Dec 5,2025│ ₦25,000  │ ₦0       │ ₦25,000 │ 1. Consultation (Qty: 1)  │
│            │            │             │             │        │           │          │          │         │    - ₦25,000               │
├────────────┼────────────┼─────────────┼─────────────┼────────┼───────────┼──────────┼──────────┼─────────┼────────────────────────────┤
│ INV-000124 │ P-000078   │ Jane Smith  │ AXA Mansard │ PAID   │ Dec 4,2025│ ₦50,000  │ ₦50,000  │ ₦0      │ 1. Surgery (Qty: 1)       │
│            │            │             │             │        │           │          │          │         │    - ₦40,000               │
│            │            │             │             │        │           │          │          │         │ 2. Medication (Qty: 2)    │
│            │            │             │             │        │           │          │          │         │    - ₦10,000               │
└────────────┴────────────┴─────────────┴─────────────┴────────┴───────────┴──────────┴──────────┴─────────┴────────────────────────────┘
```

---

## 🎯 **Use Cases:**

### **1. Monthly Claims Submission**

```
Filters:
- HMO: "Leadway HMO"
- Status: "Pending"

Action:
1. Export to Excel
2. File: HMO_Claims_2025-12-05_Leadway_HMO_pending.xlsx
3. Email to leadway_claims@leadway.com
4. Track submission in notes
```

### **2. Claims Reconciliation**

```
Filters:
- HMO: "AXA Mansard"
- Status: "Paid"

Action:
1. Export paid claims
2. Compare with bank deposits
3. Verify amounts match
4. Update any discrepancies
```

### **3. Outstanding Claims Report**

```
Filters:
- Status: "Outstanding"

Action:
1. Export all outstanding
2. Review aging (by date)
3. Follow up with HMOs
4. Send reminder emails
```

### **4. All HMOs Summary**

```
Filters:
- HMO: "All HMOs"
- Status: "All Statuses"

Action:
1. Export complete list
2. Management review
3. Financial reporting
4. Audit documentation
```

---

## 💡 **Features:**

### **Smart Column Sizing:**

- **Narrow columns** for IDs and dates
- **Medium columns** for names and amounts
- **Wide columns** for invoice items details
- **Auto-sized** for readability

### **Formatted Data:**

```typescript
// Currency formatting
'Total Amount (NGN)': 25000
'Amount Paid (NGN)': 0
'Balance (NGN)': 25000

// Invoice items with line breaks
'Invoice Items': 
  1. Consultation (Qty: 1) - ₦25,000
  2. Medication (Qty: 2) - ₦500
```

### **Dynamic Filename:**

- Includes current date
- Includes selected HMO
- Includes status filter
- Prevents overwrites

---

## 🔧 **Technical Details:**

### **File:** `apps/web/src/app/(protected)/claims/page.tsx`

**Libraries Used:**
- `xlsx` - Excel file generation
- `sonner` - Toast notifications

**Function:** `exportToExcel()`

**Key Features:**
1. ✅ Maps claim data to Excel rows
2. ✅ Formats currency and dates
3. ✅ Joins invoice items with line breaks
4. ✅ Sets column widths
5. ✅ Generates dynamic filename
6. ✅ Downloads file automatically
7. ✅ Shows success/error toasts

---

## 📊 **Data Transformation:**

### **From API Response:**

```json
{
  "id": 123,
  "invoiceId": 123,
  "status": "pending",
  "submittedAmount": 25000,
  "paidAmount": 0,
  "patient": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "hmo": {
    "name": "Leadway HMO",
    "provider": "LEAD001"
  },
  "invoiceItems": [
    {
      "description": "Consultation",
      "quantity": 1,
      "amount": 25000
    }
  ]
}
```

### **To Excel Row:**

```javascript
{
  'Invoice Number': 'INV-000123',
  'Patient ID': 'P-000045',
  'Patient Name': 'John Doe',
  'HMO Provider': 'Leadway HMO',
  'HMO Provider Code': 'LEAD001',
  'Status': 'PENDING',
  'Invoice Date': 'Dec 5, 2025',
  'Total Amount (NGN)': 25000,
  'Amount Paid (NGN)': 0,
  'Balance (NGN)': 25000,
  'Number of Items': 1,
  'Invoice Items': '1. Consultation (Qty: 1) - ₦25,000.00',
  'Notes': ''
}
```

---

## 🎨 **UI Components:**

### **Export Button:**

**Location:** Claims list header (top-right)

**States:**
- **Enabled:** When claims exist
- **Disabled:** When no claims (0 claims)

**Button:**
```jsx
<Button 
  variant="outline" 
  size="sm"
  onClick={exportToExcel}
  disabled={!claimsData?.claims || claimsData.claims.length === 0}
>
  <Download className="w-4 h-4 mr-2" />
  Export to Excel
</Button>
```

---

## 🧪 **Testing:**

### **Test Case 1: Export All Claims**

```
1. Go to Claims Management
2. Don't apply filters (All HMOs, All Statuses)
3. Click "Export to Excel"
4. Verify:
   ✅ File downloads
   ✅ Filename: HMO_Claims_2025-12-05.xlsx
   ✅ Contains all claims
   ✅ All columns present
   ✅ Data accurate
```

### **Test Case 2: Export Filtered Claims**

```
1. Select HMO: "Leadway HMO"
2. Select Status: "Pending"
3. Click "Export to Excel"
4. Verify:
   ✅ File downloads
   ✅ Filename includes: _Leadway_HMO_pending
   ✅ Only Leadway pending claims
   ✅ Data matches screen
```

### **Test Case 3: Export with Invoice Items**

```
1. Create invoice with multiple items
2. Go to Claims Management
3. Export to Excel
4. Open Excel file
5. Verify:
   ✅ All invoice items listed
   ✅ Line breaks between items
   ✅ Quantities shown
   ✅ Amounts formatted correctly
```

### **Test Case 4: No Claims to Export**

```
1. Apply filters with no matches
2. Claims (0) shown
3. Click "Export to Excel"
4. Verify:
   ✅ Button disabled
   ✅ No file downloaded
   ✅ Error toast shown
```

---

## 📧 **HMO Submission Workflow:**

### **Step-by-Step:**

```
┌─────────────────────────┐
│ 1. Filter Claims        │
│    - Select HMO         │
│    - Select Status      │
│    - Review list        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 2. Export to Excel      │
│    - Click Export       │
│    - Download file      │
│    - Verify data        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 3. Submit to HMO        │
│    - Email file         │
│    - Upload to portal   │
│    - Get reference #    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 4. Update Status        │
│    - Mark as submitted  │
│    - Add reference #    │
│    - Add notes          │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ 5. Track Payment        │
│    - Wait for HMO       │
│    - Update when paid   │
│    - Record amount      │
└─────────────────────────┘
```

---

## 💼 **Business Benefits:**

### **For Claims Team:**
- ✅ Quick export for HMO submission
- ✅ Standardized format
- ✅ Complete information
- ✅ Audit trail

### **For HMOs:**
- ✅ Structured data format
- ✅ Easy to import/process
- ✅ All required information
- ✅ Clear invoice details

### **For Management:**
- ✅ Financial reporting
- ✅ Outstanding claims tracking
- ✅ HMO performance analysis
- ✅ Revenue forecasting

---

## 🎉 **Summary:**

**Feature:** Export claims to Excel

**Purpose:** Share detailed claim information with HMOs for payment processing

**Benefits:**
- ✅ One-click export
- ✅ Formatted for HMO submission
- ✅ Complete invoice details
- ✅ Filterable by HMO and status
- ✅ Professional Excel format
- ✅ Dynamic filename with date

**Usage:**
1. Filter claims (optional)
2. Click "Export to Excel"
3. Share file with HMO
4. Track submission

---

**Added:** December 5, 2025  
**File:** `apps/web/src/app/(protected)/claims/page.tsx`  
**Impact:** Streamlined HMO claims submission process
