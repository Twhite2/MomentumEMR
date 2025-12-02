# 🔧 Fix Hospital ID Unique Constraint Error

## 🐛 **The Problem:**

```
Unique constraint failed on the fields: (`id`)
Error code: P2002
```

This error occurs when the PostgreSQL auto-increment sequence for the `hospitals` table is **out of sync** with the actual data.

---

## 🎯 **Root Cause:**

The database's auto-increment sequence is trying to use an `id` that already exists in the table. This typically happens when:

1. ✅ Data was imported manually with specific IDs
2. ✅ Data was migrated from another system
3. ✅ Database was restored from a backup

---

## ✅ **Solution:**

### **Step 1: Connect to Your Production Database**

```bash
# SSH into your server
ssh root@your-server-ip

# Connect to PostgreSQL
psql -U postgres -d momentum_emr
# Or if using a specific connection string:
psql "postgresql://username:password@localhost:5432/momentum_emr"
```

---

### **Step 2: Fix the Hospital ID Sequence**

Run this SQL command to reset the sequence:

```sql
SELECT setval(
    pg_get_serial_sequence('hospitals', 'id'), 
    (SELECT COALESCE(MAX(id), 0) + 1 FROM hospitals), 
    false
);
```

**What this does:**
- Gets the maximum `id` currently in the `hospitals` table
- Sets the sequence to `max_id + 1`
- Ensures the next hospital created gets a unique ID

---

### **Step 3: Verify the Fix**

```sql
-- Check current sequence value
SELECT currval(pg_get_serial_sequence('hospitals', 'id'));

-- Check max ID in table
SELECT MAX(id) FROM hospitals;
```

The sequence value should be **greater than** the max ID in the table.

---

### **Step 4: Fix All Tables (Preventive)**

If you want to fix all tables at once, run the SQL script I created:

```bash
# From your server
psql -U postgres -d momentum_db -f /path/to/fix-all-sequences.sql
```

Or copy-paste the SQL from `fix-all-sequences.sql` file.

---

## 🔍 **Alternative: Quick One-Liner Fix**

If you just need a quick fix for hospitals:

```bash
echo "SELECT setval(pg_get_serial_sequence('hospitals', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM hospitals), false);" | psql -U postgres -d momentum_db
```

---

## ✅ **Verification:**

After running the fix, test by creating a new hospital:

1. Go to your Super Admin dashboard
2. Try creating a new hospital
3. Should work without errors!

---

## 📊 **Updated Code:**

I've also improved the error handling in `apps/web/src/app/api/hospitals/route.ts` to:

✅ Show better error messages for ID conflicts  
✅ Distinguish between subdomain conflicts and ID sequence errors  
✅ Provide actionable feedback to users  

---

## 🚨 **If Problem Persists:**

If the error continues after running the fix:

### **Check for Table Locks:**
```sql
SELECT * FROM pg_locks WHERE relation = 'hospitals'::regclass;
```

### **Check Sequence Ownership:**
```sql
\d hospitals
-- Look for the SERIAL column and its sequence
```

### **Manual Sequence Creation (Last Resort):**
```sql
-- Drop and recreate the sequence
DROP SEQUENCE IF EXISTS hospitals_id_seq CASCADE;
CREATE SEQUENCE hospitals_id_seq START WITH 1000;
ALTER TABLE hospitals ALTER COLUMN id SET DEFAULT nextval('hospitals_id_seq');
SELECT setval('hospitals_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM hospitals), false);
```

---

## 📝 **Files Created:**

1. ✅ `fix-hospital-id-sequence.sql` - Quick fix for hospitals table only
2. ✅ `fix-all-sequences.sql` - Comprehensive fix for all tables
3. ✅ Improved error handling in `apps/web/src/app/api/hospitals/route.ts`

---

## 🎉 **Summary:**

**The fix is simple:** Just run the SQL command to reset the auto-increment sequence!

```sql
SELECT setval(
    pg_get_serial_sequence('hospitals', 'id'), 
    (SELECT COALESCE(MAX(id), 0) + 1 FROM hospitals), 
    false
);
```

**Problem solved!** ✅
