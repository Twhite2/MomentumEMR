#!/bin/bash

# Momentum EMR - Automated Backup Script
# Description: Backs up PostgreSQL database and uploaded files daily
# Usage: ./scripts/backup.sh

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.backup.env" ]; then
    source "$SCRIPT_DIR/.backup.env"
else
    echo "ERROR: .backup.env file not found!"
    echo "Please create $SCRIPT_DIR/.backup.env with your database credentials"
    exit 1
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/momentum-emr}"
DB_NAME="${DB_NAME:-momentum_db}"
DB_USER="${DB_USER:-momentum_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
UPLOAD_DIR="${UPLOAD_DIR:-/root/Momentum_EMR/uploads}"

# Timestamp for backup files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_FOLDER=$(date +"%Y-%m")

# Backup paths
BACKUP_MONTH_DIR="$BACKUP_DIR/$DATE_FOLDER"
DB_BACKUP="$BACKUP_MONTH_DIR/db_backup_$TIMESTAMP.sql.gz"
FILES_BACKUP="$BACKUP_MONTH_DIR/files_backup_$TIMESTAMP.tar.gz"
LOG_FILE="/var/log/momentum-backup.log"

# Create backup directories
mkdir -p "$BACKUP_MONTH_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "======================================"
log "Starting Momentum EMR Backup"
log "======================================"

# 1. Backup PostgreSQL Database
log "Backing up database: $DB_NAME"
export PGPASSWORD="$DB_PASSWORD"

pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --verbose \
  2>> "$LOG_FILE" \
  | gzip > "$DB_BACKUP"

if [ $? -eq 0 ]; then
    DB_SIZE=$(du -h "$DB_BACKUP" | cut -f1)
    log "✓ Database backup completed: $DB_BACKUP"
    log "  Size: $DB_SIZE"
else
    log "✗ ERROR: Database backup failed!"
    # Send alert (uncomment if you have mail configured)
    # echo "Database backup failed at $(date)" | mail -s "⚠️ Momentum EMR Backup Failed" admin@hospital.com
    exit 1
fi

unset PGPASSWORD

# 2. Backup Uploaded Files
if [ -d "$UPLOAD_DIR" ]; then
    log "Backing up uploaded files from: $UPLOAD_DIR"
    
    # Count files before backup
    FILE_COUNT=$(find "$UPLOAD_DIR" -type f | wc -l)
    log "  Files to backup: $FILE_COUNT"
    
    tar -czf "$FILES_BACKUP" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")" 2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        FILES_SIZE=$(du -h "$FILES_BACKUP" | cut -f1)
        log "✓ Files backup completed: $FILES_BACKUP"
        log "  Size: $FILES_SIZE"
    else
        log "✗ WARNING: Files backup failed (continuing anyway)"
    fi
else
    log "⚠ Upload directory not found: $UPLOAD_DIR (skipping file backup)"
fi

# 3. Create backup manifest (for easy tracking)
MANIFEST_FILE="$BACKUP_MONTH_DIR/manifest_$TIMESTAMP.txt"
cat > "$MANIFEST_FILE" << EOF
Momentum EMR Backup Manifest
====================================
Backup Date: $(date)
Hostname: $(hostname)
Server: $(hostname -I | awk '{print $1}')

Database Backup:
  File: $(basename "$DB_BACKUP")
  Size: $(du -h "$DB_BACKUP" | cut -f1)
  Location: $DB_BACKUP

Files Backup:
  File: $(basename "$FILES_BACKUP")
  Size: $(du -h "$FILES_BACKUP" | cut -f1)
  Location: $FILES_BACKUP
  Files Count: $FILE_COUNT

Database Info:
  Name: $DB_NAME
  Host: $DB_HOST
  Port: $DB_PORT
====================================
EOF

log "✓ Manifest created: $MANIFEST_FILE"

# 4. Remove old backups (older than RETENTION_DAYS)
log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=0

find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -type f -delete
DELETED_COUNT=$((DELETED_COUNT + $(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -type f | wc -l)))

find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -mtime +$RETENTION_DAYS -type f -delete
DELETED_COUNT=$((DELETED_COUNT + $(find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -mtime +$RETENTION_DAYS -type f | wc -l)))

find "$BACKUP_DIR" -name "manifest_*.txt" -mtime +$RETENTION_DAYS -type f -delete

# Remove empty month directories
find "$BACKUP_DIR" -type d -empty -delete

log "✓ Cleanup completed (removed $DELETED_COUNT old files)"

# 5. Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

# 6. Display summary
log "======================================"
log "Backup Summary:"
log "  Database: $(basename "$DB_BACKUP") ($DB_SIZE)"
[ -f "$FILES_BACKUP" ] && log "  Files: $(basename "$FILES_BACKUP") ($FILES_SIZE)"
log "  Manifest: $(basename "$MANIFEST_FILE")"
log "  Total backup size: $TOTAL_SIZE"
log "  Retention: $RETENTION_DAYS days"
log "  Location: $BACKUP_MONTH_DIR"
log "Backup completed successfully!"
log "======================================"

# 7. Optional: Upload to remote storage (uncomment if needed)
# if [ -f "$SCRIPT_DIR/upload-to-remote.sh" ]; then
#     log "Uploading to remote storage..."
#     bash "$SCRIPT_DIR/upload-to-remote.sh" "$DB_BACKUP" "$FILES_BACKUP"
# fi

exit 0
