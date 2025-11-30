# Momentum EMR - Backup Setup Guide

Complete guide to setting up automated daily backups for your Momentum EMR system.

---

## 📋 What Gets Backed Up

1. **PostgreSQL Database** (all patient data, invoices, appointments, etc.)
2. **Uploaded Files** (patient documents, images, lab results, etc.)
3. **Backup Manifest** (metadata about each backup)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Upload Scripts to Server

From your local machine, upload the scripts:

```bash
# From your local project directory
scp scripts/backup.sh root@your-server-ip:/root/Momentum_EMR/scripts/
scp scripts/restore.sh root@your-server-ip:/root/Momentum_EMR/scripts/
scp scripts/.backup.env.example root@your-server-ip:/root/Momentum_EMR/scripts/
```

### Step 2: SSH into Your Server

```bash
ssh root@your-server-ip
cd /root/Momentum_EMR
```

### Step 3: Configure Database Credentials

```bash
# Copy the example file
cp scripts/.backup.env.example scripts/.backup.env

# Edit with your actual credentials
nano scripts/.backup.env
```

**Fill in your actual database credentials:**
```bash
DB_NAME="momentum_db"              # Your database name
DB_USER="momentum_user"            # Your database user
DB_PASSWORD="YOUR_ACTUAL_PASSWORD" # Your database password
DB_HOST="localhost"                # Usually localhost
DB_PORT="5432"                     # PostgreSQL default port
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Secure the Environment File

```bash
# Make it readable only by root
chmod 600 scripts/.backup.env

# Verify permissions
ls -la scripts/.backup.env
# Should show: -rw------- (only root can read/write)
```

### Step 5: Make Scripts Executable

```bash
chmod +x scripts/backup.sh
chmod +x scripts/restore.sh
```

### Step 6: Test the Backup Manually

```bash
# Run backup script
./scripts/backup.sh

# Check if it worked
ls -lh /var/backups/momentum-emr/
```

**You should see:**
- `db_backup_YYYYMMDD_HHMMSS.sql.gz` (database)
- `files_backup_YYYYMMDD_HHMMSS.tar.gz` (files)
- `manifest_YYYYMMDD_HHMMSS.txt` (backup info)

---

## ⏰ Automate with Cron (Daily at 2 AM)

### Step 1: Open Crontab

```bash
crontab -e
```

### Step 2: Add This Line

```bash
# Momentum EMR Daily Backup - Runs at 2 AM every day
0 2 * * * /root/Momentum_EMR/scripts/backup.sh >> /var/log/momentum-backup.log 2>&1
```

### Step 3: Save and Exit

**For nano:** Press `Ctrl+X`, then `Y`, then `Enter`  
**For vim:** Press `Esc`, type `:wq`, press `Enter`

### Step 4: Verify Cron Job is Active

```bash
# List all cron jobs
crontab -l

# Check cron service is running
systemctl status cron
```

---

## 📅 Alternative Backup Schedules

Choose the schedule that fits your needs:

```bash
# Every 6 hours
0 */6 * * * /root/Momentum_EMR/scripts/backup.sh

# Twice daily (2 AM and 2 PM)
0 2,14 * * * /root/Momentum_EMR/scripts/backup.sh

# Every 4 hours (intensive)
0 */4 * * * /root/Momentum_EMR/scripts/backup.sh

# Weekly only (Sunday at 3 AM)
0 3 * * 0 /root/Momentum_EMR/scripts/backup.sh
```

---

## 🔄 Restoring from Backup

### Interactive Restore (Recommended)

```bash
cd /root/Momentum_EMR
./scripts/restore.sh
```

This will:
1. Show you all available backups
2. Let you select which one to restore
3. Create a safety backup before restoring
4. Restore database and files

### Restore Specific Backup

```bash
# If you know the timestamp
./scripts/restore.sh 20250130_020000
```

---

## 📊 Monitoring Your Backups

### Check Backup Log

```bash
# View recent backup activity
tail -50 /var/log/momentum-backup.log

# Follow log in real-time
tail -f /var/log/momentum-backup.log
```

### List All Backups

```bash
# See all backups
ls -lh /var/backups/momentum-emr/

# See backup sizes by month
du -sh /var/backups/momentum-emr/*/
```

### Check Total Backup Size

```bash
du -sh /var/backups/momentum-emr/
```

---

## 🔧 Configuration Options

Edit `scripts/.backup.env` to customize:

```bash
# How long to keep backups (default: 30 days)
RETENTION_DAYS="30"

# Change backup location
BACKUP_DIR="/mnt/external-drive/backups"

# Change uploads directory location
UPLOAD_DIR="/root/Momentum_EMR/uploads"
```

---

## 🌐 Optional: Offsite Backup (Recommended)

For additional safety, upload backups to cloud storage.

### Option 1: AWS S3 (Most Popular)

```bash
# Install AWS CLI
apt install awscli -y

# Configure AWS credentials
aws configure
```

**Cost:** ~$0.01/GB/month (~$5/month for 500GB)

### Option 2: Backblaze B2 (Cheaper)

```bash
# Install B2 CLI
pip install b2

# Configure
b2 authorize-account
```

**Cost:** ~$0.005/GB/month (~$2.50/month for 500GB)

---

## ✅ Best Practices

1. **Test Restores Monthly**
   ```bash
   # Create a test database and restore to it
   ./scripts/restore.sh
   ```

2. **Monitor Disk Space**
   ```bash
   df -h /var/backups
   ```

3. **Keep Backups Offsite**
   - Upload to S3/B2 for disaster recovery
   - Store on external drive

4. **Document Your Process**
   - Keep credentials secure
   - Note any custom configurations

---

## 🆘 Troubleshooting

### Backup Script Fails

```bash
# Check database connection
psql -h localhost -U momentum_user -d momentum_db -c "\l"

# Check disk space
df -h

# Check permissions
ls -la scripts/.backup.env
```

### Cron Job Not Running

```bash
# Check cron service
systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Verify cron job is listed
crontab -l
```

### Backup Directory Full

```bash
# Check space
du -sh /var/backups/momentum-emr/

# Manually clean old backups
find /var/backups/momentum-emr/ -mtime +30 -delete

# Or reduce retention period in .backup.env
```

---

## 📞 Support

If you encounter issues:
1. Check `/var/log/momentum-backup.log`
2. Verify database credentials in `.backup.env`
3. Ensure PostgreSQL is running: `systemctl status postgresql`
4. Check disk space: `df -h`

---

## 🎯 Summary

✅ **What You've Set Up:**
- Automated daily backups at 2 AM
- 30-day retention (configurable)
- Database + files backup
- Easy restore process
- Comprehensive logging

✅ **What You're Saving:**
- Vultr backup service cost (~$10-20/month)
- Full control over backup process
- Faster restore times

✅ **Next Steps:**
1. Wait for tomorrow's automatic backup
2. Test a restore in a few days
3. Consider adding offsite backup
4. Monitor logs weekly

---

**Your backups are now automatic and secure! 🎉**
