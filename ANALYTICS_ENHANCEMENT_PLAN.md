# Hospital Admin Analytics Enhancement Plan

## Current Features (Existing):
✅ Revenue metrics
✅ Patient distribution
✅ Date range filter
✅ Inventory alerts (low stock, expired, expiring soon)
✅ Appointment stats
✅ Revenue by patient type

---

## New Features to Add:

### **Top Metrics Row (6 cards):**
1. Revenue ✅ (exists)
2. ⭐ Medical Records Made (date range)
3. ⭐ Patients on Admission (date range)
4. Total Invoices ✅ (exists but needs breakdown)
5. ⭐ Total Prescriptions
6. ⭐ Total Investigations

### **Breakdown Cards (6 green cards):**
7. ⭐ Revenue: HMO/Self/Corporate numbers
8. ⭐ Medical Records: HMO/Self/Corporate numbers
9. ⭐ Admissions: HMO/Self/Corporate numbers
10. ⭐ Invoices: Pending/Completed numbers
11. ⭐ Prescriptions: Pending/Completed numbers
12. ⭐ Investigations: Pending/Completed numbers

### **Analysis Cards (6 large cards):**
13. ⭐ Top 5 HMO Clients (name, revenue, amount spent)
14. ⭐ Total Claims Submitted (accruing total revenue)
15. ⭐ Top 5 Diagnosis (with %)
16. Payment Method % (HMO/Self/Corporate) - enhance existing
17. ⭐ Top 5 Drug Areas (NSAIDs %, Antimalaria %)
18. ⭐ Top 5 Lab Test Areas (Blood %, X-ray %, Scan %)

### **Bottom Section (3 cards):**
19. Inventory Alerts ✅ (enhance: low stock, expiring 90 days, expired)
20. ⭐ Patient Age Distribution
21. ⭐ Average Time Per Section (Front desk → Nursing → Medical Records → Investigation → Pharmacy)

---

## Implementation Status:

### Phase 1: API ✅
- Created `/api/analytics/comprehensive` endpoint
- Queries for all new metrics
- Date range support

### Phase 2: UI Components (Next)
- Update analytics page layout
- Add new metric cards
- Add breakdown cards
- Add analysis sections
- Keep existing clean design

### Phase 3: Time Tracking (Future)
- Requires timestamp tracking at each clinical stage
- Database schema updates needed
- Separate implementation

---

## Design Principles:
- Clean white cards with borders
- Consistent spacing
- Icon-based design
- Color coding: Blue (main), Green (breakdown), Alert colors (inventory)
- Maintain current professional look
