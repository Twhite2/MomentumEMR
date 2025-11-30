# Automated Billing & Claims Tracking Implementation Plan

## Overview
This document outlines the remaining implementation work for the 7 major feature requests.

## ✅ Completed Features (1-3)

### 1. ✅ Generate Invoice Button
- **Location**: Prescription detail page (`/prescriptions/[id]`)
- **Implementation**: Added "Generate Invoice" button above "Mark as Dispensed"
- **Access**: Pharmacists and Admin only
- **Flow**: Clicking button navigates to invoice creation with prescription & patient pre-selected

### 2. ✅ Remove Lab Test Ordering for Pharmacists  
- **Implementation**: Updated Quick Actions section
- **Access**: Only doctors and admin can order lab tests now
- **Impact**: Pharmacists removed from lab test ordering workflow

### 3. ✅ Database Schema Updates
- **Added**: `disputed` and `outstanding` to ClaimStatus enum
- **Purpose**: Support comprehensive claims tracking
- **Migration**: Requires running `npx prisma migrate dev`

## 🔄 In Progress Features (4-7)

### 4. Automated Billing with HMO Tariff Integration

#### 4.1 New API Endpoints Created
- ✅ `/api/hmo-tariffs` - Fetch HMO tariffs for a patient's HMO
- ✅ `/api/inventory/pricing` - Fetch inventory items with pricing

#### 4.2 Invoice Creation Page Rewrite Required
**File**: `apps/web/src/app/(protected)/invoices/new/page.tsx`

**Key Requirements**:
1. **Auto-detect patient type** (HMO, Corporate, Self-Pay)
2. **Smart Dropdown System**:
   - HMO Patients: Show HMO tariff items from their HMO plan
   - Self-Pay Patients: Show inventory items with unitPrice
   - Corporate Patients: Show inventory items with corporatePrice
3. **Auto-populate prices** when item selected from dropdown
4. **Manual override option** - Allow editing auto-populated price
5. **Visual indicators**:
   - Show if price is from tariff/inventory
   - Show if price was manually overridden
   - Warning if HMO item requires pre-authorization

**Implementation Steps**:
```typescript
// 1. Fetch patient details including type and HMO
const { data: patient } = useQuery({
  queryKey: ['patient', patientId],
  queryFn: async () => {
    const res = await axios.get(`/api/patients/${patientId}`);
    return res.data;
  },
  enabled: !!patientId,
});

// 2. Fetch appropriate pricing source
const { data: pricingData } = useQuery({
  queryKey: ['pricing', patient?.patientType, patient?.hmoId],
  queryFn: async () => {
    if (patient?.patientType === 'hmo' && patient?.hmoId) {
      const res = await axios.get(`/api/hmo-tariffs?patientId=${patientId}`);
      return { type: 'tariff', data: res.data.tariffs };
    } else {
      const res = await axios.get('/api/inventory/pricing');
      return { type: 'inventory', data: res.data.inventory };
    }
  },
  enabled: !!patient,
});

// 3. Update item selection to auto-populate price
const handleItemSelect = (index: number, selectedId: string) => {
  const item = pricingData.data.find(i => i.id === parseInt(selectedId));
  if (item) {
    const price = getPrice(item, patient.patientType);
    updateItem(index, 'unitPrice', price.toString());
    updateItem(index, 'isManualOverride', false);
  }
};

// 4. Helper to get correct price based on patient type
const getPrice = (item: any, patientType: string) => {
  if (pricingData.type === 'tariff') {
    return item.basePrice;
  } else {
    if (patientType === 'hmo') return item.hmoPrice || item.unitPrice;
    if (patientType === 'corporate') return item.corporatePrice || item.unitPrice;
    return item.unitPrice;
  }
};
```

**UI Changes Needed**:
- Replace free-text "Description" input with searchable dropdown
- Add "Manual Price Override" checkbox for each item
- Show badge indicating price source (HMO Tariff / Inventory / Manual)
- Show patient type prominently (HMO: [Name] / Corporate / Self-Pay)

### 5. Navigation Reorganization

**Files to Update**:
- `apps/web/src/components/layout/Sidebar.tsx` (or wherever navigation is defined)

**Changes Required**:
1. **All Users**: Move "Patient Queue" higher in navigation order
2. **Pharmacist**: Move "Prescriptions", "Pharmacy", "Inventory" higher
3. **Current Order Example**:
   ```
   - Dashboard
   - Patient Queue  ← Moved up for all
   - Appointments
   - [For Pharmacist specifically]
     - Prescriptions  ← Moved up
     - Pharmacy       ← Moved up  
     - Inventory      ← Moved up
   ```

### 6. Remove Revenue from Doctor Analytics

**File**: `apps/web/src/app/(protected)/dashboard/page.tsx` (or analytics page)

**Changes**:
- Conditionally hide revenue metrics if `session.user.role === 'doctor'`
- Keep visible for admin, super_admin, cashier

**Example**:
```typescript
{session?.user?.role !== 'doctor' && (
  <div className="revenue-card">
    {/* Revenue metrics */}
  </div>
)}
```

### 7. Comprehensive Claims Tracking System

This is the most complex feature requiring multiple components.

#### 7.1 Database Schema (Already Updated)
- ✅ ClaimStatus enum includes: submitted, disputed, outstanding, paid, denied

#### 7.2 Claims Management API Required
**File**: `apps/web/src/app/api/claims/analytics/route.ts` (NEW)

**Endpoint**: `GET /api/claims/analytics`

**Response Structure**:
```typescript
{
  summary: {
    totalClaims: number,
    totalAmount: number,
    submitted: { count: number, amount: number },
    paid: { count: number, amount: number },
    denied: { count: number, amount: number },
    disputed: { count: number, amount: number },
    outstanding: { count: number, amount: number },
  },
  byHmo: [
    {
      hmoId: number,
      hmoName: string,
      submitted: { count: number, amount: number },
      paid: { count: number, amount: number },
      denied: { count: number, amount: number },
      disputed: { count: number, amount: number },
      outstanding: { count: number, amount: number },
    }
  ],
  monthlyTrends: [
    {
      month: string, // '2025-01'
      submitted: number,
      paid: number,
      denied: number,
      disputed: number,
      outstanding: number,
    }
  ]
}
```

**SQL Logic** (using Prisma):
```typescript
// Group claims by status
const claimsByStatus = await prisma.claimSubmission.groupBy({
  by: ['status'],
  _count: { id: true },
  _sum: { submittedAmount: true },
  where: { hmoId, /* date filters */ },
});

// Group by HMO
const claimsByHmo = await prisma.claimSubmission.groupBy({
  by: ['hmoId', 'status'],
  _count: { id: true },
  _sum: { submittedAmount: true },
  where: { hospitalId, /* date filters */ },
});
```

#### 7.3 Claims Status Management UI
**File**: `apps/web/src/app/(protected)/claims/page.tsx` (NEW)

**Features**:
- List all claim submissions
- Filter by HMO, status, date range
- Bulk status updates
- Individual claim detail view with status change

**Status Change Form**:
```typescript
interface StatusUpdate {
  claimId: number;
  newStatus: 'submitted' | 'paid' | 'denied' | 'disputed' | 'outstanding';
  approvedAmount?: number;  // if paid/partially_paid
  paidAmount?: number;      // if paid
  denialReason?: string;    // if denied
  responseDate?: Date;
  paymentDate?: Date;       // if paid
}
```

#### 7.4 Claims Analytics Dashboard
**File**: `apps/web/src/app/(protected)/dashboard/page.tsx` (UPDATE)

**New Dashboard Cards** (for admin/cashier only):
1. **Claims Overview Card**:
   - Total claims submitted this month
   - Total amount submitted
   - Pie chart: Claims by status

2. **HMO Performance Card**:
   - Table showing each HMO with:
     - Claims submitted
     - Claims paid
     - Claims denied/disputed
     - Outstanding amount
     - Payment rate %

3. **Monthly Trends Card**:
   - Line chart showing claims submitted vs paid over time
   - Bar chart for outstanding amounts by month

4. **Action Items Card**:
   - Outstanding claims count
   - Disputed claims requiring follow-up
   - Recently denied claims

## Migration Required

Before running the application, execute:

```bash
cd packages/database
npx prisma migrate dev --name add_claim_statuses
npx prisma generate
```

## Testing Checklist

### Invoice Generation
- [ ] HMO patient sees tariff items from their HMO
- [ ] Self-pay patient sees inventory items
- [ ] Prices auto-populate correctly
- [ ] Manual price override works
- [ ] Prescription-linked invoices pre-populate items

### Navigation
- [ ] Patient Queue is higher for all users
- [ ] Pharmacy section is higher for pharmacists
- [ ] Order is logical and accessible

### Doctor Analytics
- [ ] Doctors don't see revenue metrics
- [ ] Admin/cashier still see full analytics

### Claims Tracking
- [ ] Can update claim status
- [ ] Analytics show correct breakdowns
- [ ] HMO-wise reports are accurate
- [ ] Monthly trends are correct

## Priority Order for Implementation

1. **HIGH**: Complete automated billing invoice page (Feature 4)
2. **MEDIUM**: Navigation reorganization (Feature 5)
3. **MEDIUM**: Remove doctor revenue (Feature 6)
4. **HIGH**: Claims tracking system (Feature 7)

## Estimated Effort

- Invoice automation: 4-6 hours
- Navigation: 1 hour
- Doctor analytics: 30 minutes
- Claims system: 6-8 hours

**Total**: ~12-16 hours of development

## Notes

- All features require thorough testing with different user roles
- HMO tariff system assumes tariffs are already loaded in database
- Claims tracking requires training staff on status management workflow
- Consider adding audit logs for price overrides and status changes
