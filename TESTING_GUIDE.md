# Testing Guide - Phase 2 Features

This guide will help you test the new patient management features.

---

## Prerequisites

Make sure you have:
1. ✅ Installed all dependencies (`pnpm install`)
2. ✅ Generated Prisma client (`pnpm db:generate`)
3. ✅ Set up `.env` file in `apps/web/`
4. ✅ Pushed database schema (`pnpm db:push`)
5. ✅ Seeded sample data (`cd packages/database && pnpm seed`)

---

## Starting the Application

```bash
# From project root
pnpm dev

# Application will start at http://localhost:3000
```

---

## Test Scenario 1: Login & Dashboard

1. Navigate to http://localhost:3000
2. You'll be redirected to login page
3. Login with any demo credential:
   - **Admin**: `admin@citygeneralhospital.com`
   - **Doctor**: `sarah.johnson@citygeneralhospital.com`
   - **Nurse**: `emily.williams@citygeneralhospital.com`
   - **Password**: `password123`
4. You should see the role-specific dashboard

**Expected Result**: ✅ Login successful, dashboard loads with KPIs

---

## Test Scenario 2: View Patient List

1. Click "Patients" in the sidebar
2. You should see a list of seeded patients
3. Try the search box - search for "John" or "Mary"
4. Use the patient type filter dropdown
5. Try pagination if there are multiple pages

**Expected Result**: ✅ Patient list displays, search and filters work

---

## Test Scenario 3: Register New Patient (Self-Pay)

1. From patients page, click "Add Patient" button
2. Fill in the form:
   - First Name: `Test`
   - Last Name: `Patient`
   - Date of Birth: Select any past date
   - Gender: Select `Male` or `Female`
   - Patient Type: Leave as `Self Pay`
   - Phone: `+234-800-555-1234`
   - Email: `test.patient@email.com`
   - Address: `123 Test Street, Lagos`
   - Emergency Contact: `Jane Patient - Sister - +234-800-555-5678`
3. Click "Register Patient"
4. You should be redirected to the patient detail page

**Expected Result**: ✅ Patient created successfully, toast notification appears

---

## Test Scenario 4: Register HMO Patient

1. Go to `/patients/new`
2. Fill in basic information
3. Change "Patient Type" to `HMO`
4. Notice the HMO Policy dropdown appears
5. Select an HMO policy (e.g., "Premium Health Plus")
6. Complete and submit

**Expected Result**: ✅ Patient created with HMO coverage

---

## Test Scenario 5: Register Corporate Patient

1. Go to `/patients/new`
2. Fill in basic information
3. Change "Patient Type" to `Corporate`
4. Notice the Corporate Client dropdown appears
5. Select a corporate client (e.g., "Tech Solutions Ltd")
6. Complete and submit

**Expected Result**: ✅ Patient created with corporate client link

---

## Test Scenario 6: View Patient Details

1. From patient list, click "View" on any patient
2. You should see:
   - Patient profile card with avatar
   - Age calculated from DOB
   - Patient type badge (colored)
   - Contact information
   - Quick action buttons
   - Recent appointments (if any)
   - Medical records (if any)
   - Prescriptions (if any)

**Expected Result**: ✅ Complete patient profile displays

---

## Test Scenario 7: Search Functionality

1. Go to `/patients`
2. In search box, type patient name
3. Results should filter immediately
4. Try searching by email
5. Try partial matches

**Expected Result**: ✅ Search returns relevant patients

---

## Test Scenario 8: Role-Based Access

### As Doctor:
1. Login as doctor
2. Can view patients ✅
3. Can see "Add Patient" button? Check PAGE_Flow.md

### As Nurse:
1. Login as nurse
2. Can view patients ✅
3. Can add new patients ✅

### As Cashier:
1. Login as cashier
2. Can view patients ✅
3. Used for billing purposes

**Expected Result**: ✅ Access controls work per role

---

## Test Scenario 9: Form Validation

1. Go to `/patients/new`
2. Try submitting empty form
3. Required fields should show validation
4. Try invalid email format
5. Try selecting HMO but not choosing a policy

**Expected Result**: ✅ Form validates before submission

---

## Test Scenario 10: Responsive Design

1. Resize browser window to mobile size
2. Check login page
3. Check dashboard
4. Check patient list
5. Check registration form

**Expected Result**: ✅ All pages work on mobile

---

## Troubleshooting

### Issue: "Failed to load patients"
**Solution**: 
- Check database connection in `.env`
- Run `pnpm db:push` to ensure schema is up to date
- Check browser console for errors

### Issue: "Authentication required"
**Solution**:
- Clear browser cookies
- Login again
- Check `NEXTAUTH_SECRET` in `.env`

### Issue: HMO/Corporate dropdown is empty
**Solution**:
- Run seed script: `cd packages/database && pnpm seed`
- This creates sample HMO policies and corporate clients

### Issue: "Cannot find module"
**Solution**:
- Run `pnpm install` again
- Run `pnpm db:generate`
- Restart dev server

### Issue: Page not loading
**Solution**:
- Check terminal for errors
- Ensure port 3000 is not in use
- Check `DATABASE_URL` is correct

---

## Database Inspection

To view database contents:

```bash
pnpm db:studio
```

This opens Prisma Studio at http://localhost:5555 where you can:
- View all tables
- See created patients
- Check relationships
- Manually edit data

---

## API Testing (Advanced)

### Test API Endpoints Directly

```bash
# Get patients list (requires authentication)
curl http://localhost:3000/api/patients

# Get HMO list
curl http://localhost:3000/api/hmo

# Get corporate clients
curl http://localhost:3000/api/corporate-clients
```

---

## Next Features to Test (Coming Soon)

- [ ] Patient edit functionality
- [ ] Appointment scheduling
- [ ] Medical records creation
- [ ] Prescription management
- [ ] Billing & invoices

---

## Reporting Issues

If you find bugs:
1. Note the steps to reproduce
2. Check browser console for errors
3. Check terminal for server errors
4. Document expected vs actual behavior

---

## Success Criteria

✅ All 10 test scenarios pass
✅ No console errors
✅ Data persists after page refresh
✅ Search and filters work smoothly
✅ Forms validate properly
✅ Role-based access works
✅ Responsive on mobile

---

**Happy Testing!** 🎉

If all tests pass, you're ready to continue building more features!
