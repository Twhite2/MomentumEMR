# Super Admin Dashboard - Implementation Plan

## ✅ Completed: Enhanced API

**File:** `apps/web/src/app/api/super-admin/stats/route.ts`

**New Metrics Added:**
1. New patients registered this week
2. Active users now (last 24 hours)
3. Total notifications
4. Unread notifications / Read rate
5. Total claims (HMO invoices)
6. Medications dispensed this week
7. Lab tests ordered this week
8. Complete records percentage
9. HMO usage percentage
10. Appointment activity by day (for chart)
11. Total prescriptions

---

## 📋 UI Components to Implement

### **Header**
- Yellow banner: "Momentum's Operations Dashboard"
- Filter button: "Filter by hospitals and together as one"

### **Top Row (5 Blue Oval Cards)**
1. Total Hospitals
2. Total Patients
3. Active Subscription
4. New patients registered this week ⭐
5. Total Subscription revenue

### **Second Row - 3 Cards**
6. **Patient Type Breakdown** - Pie chart (HMO, Corporate, Self pay)
7. **System Monitoring** - 3 metrics:
   - Total users logged in
   - Error logs / Failed processes
   - Average time per user on system
8. **Quick Action Buttons** (right side):
   - Manage Hospitals
   - View Subscriptions
   - Aggregated Reports

### **Third Row - 3 Cards**
9. **Platform Statistics**:
   - Total invoices
   - Total claims submitted
   - Total notifications
   - Read rate

10. **Weekly Activity**:
    - Total medications dispensed in a week
    - Total lab test ordered in a week

11. **Appointment Activity Chart**:
    - Stacked bar chart
    - Days: Monday-Thursday
    - Types: adoption, New/OPD, New/visit x1

### **Fourth Row - Adoption Metrics**
12. **Adoption Metrics Card** (Large):
    - User activity levels
    - Hospital usage scoring
    - Consult time scoring per hospital
    - Percentage of complete patient records
    - Insurance usage percentage across all hospitals

---

## 🎨 Design Principles
- Keep current clean white card design
- Blue oval cards for top metrics
- Professional layout
- Consistent spacing
- Icons for visual clarity
- Color-coded sections

---

## 📊 Chart Requirements
- Stacked bar chart for appointments
- Different colors for appointment types
- X-axis: Weekdays
- Y-axis: Count
- Legend showing appointment types
