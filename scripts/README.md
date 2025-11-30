# Momentum EMR - Backup Scripts

Automated backup and restore utilities for Momentum EMR system.

---

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `backup.sh` | Main backup script - backs up database and files |
| `restore.sh` | Restore script - recovers from backups |
| `test-backup.sh` | Test script - validates backup configuration |
| `.backup.env.example` | Template for database credentials |
| `.backup.env` | **Your actual credentials (DO NOT COMMIT!)** |
| `BACKUP_SETUP.md` | Complete setup guide |

---

## 🚀 Quick Start

### 1. **First Time Setup**

```bash
# On your server
cd /root/Momentum_EMR

# Create environment file
cp scripts/.backup.env.example scripts/.backup.env

# Edit with your credentials
nano scripts/.backup.env

# Secure the file
chmod 600 scripts/.backup.env

# Make scripts executable
chmod +x scripts/*.sh
```

### 2. **Test Your Setup**

```bash
# Run the test script
./scripts/test-backup.sh
```

### 3. **Run a Manual Backup**

```bash
# Create your first backup
./scripts/backup.sh

# Check the results
ls -lh /var/backups/momentum-emr/
```

### 4. **Set Up Automatic Daily Backups**

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /root/Momentum_EMR/scripts/backup.sh >> /var/log/momentum-backup.log 2>&1
```

---

## 📖 Detailed Guides

- **[BACKUP_SETUP.md](./BACKUP_SETUP.md)** - Complete setup and configuration guide
- Includes troubleshooting, monitoring, and best practices

---

## 🔄 Common Commands

### Backup Operations

```bash
# Manual backup
./scripts/backup.sh

# Check backup log
tail -50 /var/log/momentum-backup.log

# List all backups
ls -lh /var/backups/momentum-emr/

# Check total backup size
du -sh /var/backups/momentum-emr/
```

### Restore Operations

```bash
# Interactive restore (shows all backups)
./scripts/restore.sh

# Restore specific backup by timestamp
./scripts/restore.sh 20250130_020000
```

### Monitoring

```bash
# View cron jobs
crontab -l

# Check if backup ran
grep "Backup completed" /var/log/momentum-backup.log

# Watch backup in real-time
tail -f /var/log/momentum-backup.log
```

---

## 📊 What Gets Backed Up

### 1. PostgreSQL Database
- All tables, schemas, and data
- Compressed with gzip
- Location: `/var/backups/momentum-emr/YYYY-MM/db_backup_TIMESTAMP.sql.gz`

### 2. Uploaded Files
- Patient documents
- Lab results
- Medical images
- Location: `/var/backups/momentum-emr/YYYY-MM/files_backup_TIMESTAMP.tar.gz`

### 3. Backup Manifest
- Metadata about each backup
- File sizes, timestamps
- Location: `/var/backups/momentum-emr/YYYY-MM/manifest_TIMESTAMP.txt`

---

## ⚙️ Configuration

Edit `scripts/.backup.env` to customize:

```bash
# Database settings
DB_NAME="momentum_db"
DB_USER="momentum_user"
DB_PASSWORD="your_password"
DB_HOST="localhost"
DB_PORT="5432"

# Backup settings
BACKUP_DIR="/var/backups/momentum-emr"
UPLOAD_DIR="/root/Momentum_EMR/uploads"
RETENTION_DAYS="30"  # How long to keep backups
```

---

## 🔒 Security

✅ **What We've Done:**
- `.backup.env` is in `.gitignore` (never committed)
- File permissions set to 600 (only root can read)
- Credentials stored separately from scripts
- Backups stored in secure directory

⚠️ **Important:**
- Never commit `.backup.env` to Git
- Keep backup directory secure (chmod 700)
- Regularly test restores
- Consider offsite backup for disaster recovery

---

## 🆘 Troubleshooting

### Backup Fails

```bash
# Test database connection
psql -h localhost -U momentum_user -d momentum_db -c "\l"

# Check credentials
cat scripts/.backup.env  # Verify settings

# Check disk space
df -h
```

### Cron Not Running

```bash
# Check cron service
systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Verify cron job exists
crontab -l | grep backup
```

### Backup Directory Full

```bash
# Check space used
du -sh /var/backups/momentum-emr/

# Manually clean old backups
find /var/backups/momentum-emr/ -mtime +30 -delete

# Or reduce RETENTION_DAYS in .backup.env
```

---

## 💰 Cost Savings

By setting this up yourself instead of using Vultr's paid backup service:

- **Saves:** ~$10-20/month
- **Full Control:** Customize retention, frequency, and storage
- **Faster Restores:** Direct access to backups
- **Learning:** Understand your backup process

---

## 📞 Need Help?

1. Check `BACKUP_SETUP.md` for detailed instructions
2. Run `./scripts/test-backup.sh` to diagnose issues
3. Check logs: `/var/log/momentum-backup.log`
4. Verify disk space: `df -h`

---

## ✅ Best Practices

- ✅ Test restores monthly
- ✅ Monitor backup logs weekly  
- ✅ Keep 30 days of backups minimum
- ✅ Consider offsite backup (S3, Backblaze)
- ✅ Document your backup process
- ✅ Verify backups are completing

---

**Your data is precious. Back it up! 🔒**
