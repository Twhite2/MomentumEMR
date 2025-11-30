#!/bin/bash

# Momentum EMR - Database & Files Restore Script
# Description: Restores database and files from backup
# Usage: ./scripts/restore.sh [backup_timestamp]

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.backup.env" ]; then
    source "$SCRIPT_DIR/.backup.env"
else
    echo "ERROR: .backup.env file not found!"
    exit 1
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/momentum-emr}"
DB_NAME="${DB_NAME:-momentum_db}"
DB_USER="${DB_USER:-momentum_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
UPLOAD_DIR="${UPLOAD_DIR:-/root/Momentum_EMR/uploads}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}======================================"
echo "Momentum EMR - Restore Utility"
echo "======================================${NC}"
echo ""

# Function to list available backups
list_backups() {
    echo "Available backups:"
    echo ""
    
    # Find all database backups and sort by date
    BACKUPS=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f | sort -r)
    
    if [ -z "$BACKUPS" ]; then
        echo -e "${RED}No backups found in $BACKUP_DIR${NC}"
        exit 1
    fi
    
    INDEX=1
    declare -A BACKUP_MAP
    
    while IFS= read -r backup; do
        BASENAME=$(basename "$backup")
        TIMESTAMP=$(echo "$BASENAME" | sed 's/db_backup_//' | sed 's/.sql.gz//')
        SIZE=$(du -h "$backup" | cut -f1)
        DATE=$(date -d "${TIMESTAMP:0:8} ${TIMESTAMP:9:2}:${TIMESTAMP:11:2}:${TIMESTAMP:13:2}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "$TIMESTAMP")
        
        # Check if files backup exists
        FILES_BACKUP="${backup/db_backup_/files_backup_}"
        FILES_BACKUP="${FILES_BACKUP/.sql.gz/.tar.gz}"
        
        if [ -f "$FILES_BACKUP" ]; then
            FILES_SIZE=$(du -h "$FILES_BACKUP" | cut -f1)
            echo -e "${GREEN}[$INDEX]${NC} $DATE"
            echo "    Database: $SIZE | Files: $FILES_SIZE"
        else
            echo -e "${YELLOW}[$INDEX]${NC} $DATE"
            echo "    Database: $SIZE | Files: Not found"
        fi
        
        BACKUP_MAP[$INDEX]="$TIMESTAMP"
        ((INDEX++))
        echo ""
    done <<< "$BACKUPS"
    
    # Prompt user to select backup
    echo -n "Select backup number to restore (or 'q' to quit): "
    read SELECTION
    
    if [ "$SELECTION" = "q" ]; then
        echo "Restore cancelled."
        exit 0
    fi
    
    SELECTED_TIMESTAMP="${BACKUP_MAP[$SELECTION]}"
    
    if [ -z "$SELECTED_TIMESTAMP" ]; then
        echo -e "${RED}Invalid selection!${NC}"
        exit 1
    fi
    
    echo "$SELECTED_TIMESTAMP"
}

# If timestamp not provided, list and select
if [ -z "$1" ]; then
    TIMESTAMP=$(list_backups)
else
    TIMESTAMP="$1"
fi

# Confirm backup files exist
DB_BACKUP=$(find "$BACKUP_DIR" -name "db_backup_${TIMESTAMP}.sql.gz" -type f)
FILES_BACKUP=$(find "$BACKUP_DIR" -name "files_backup_${TIMESTAMP}.tar.gz" -type f)

if [ -z "$DB_BACKUP" ]; then
    echo -e "${RED}ERROR: Database backup not found for timestamp: $TIMESTAMP${NC}"
    exit 1
fi

echo -e "${YELLOW}======================================"
echo "Restore Summary:"
echo "======================================${NC}"
echo "Database backup: $DB_BACKUP"
[ -f "$FILES_BACKUP" ] && echo "Files backup: $FILES_BACKUP" || echo "Files backup: Not found (skipping)"
echo ""
echo -e "${RED}WARNING: This will REPLACE your current database and files!${NC}"
echo -n "Are you sure you want to proceed? (type 'yes' to confirm): "
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting restore...${NC}"
echo ""

# 1. Create backup of current database before restoring (safety net)
echo "Creating safety backup of current database..."
SAFETY_BACKUP="/tmp/momentum_pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$SAFETY_BACKUP"
echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP${NC}"
echo ""

# 2. Restore Database
echo "Restoring database from: $DB_BACKUP"

# Drop existing connections (PostgreSQL)
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null

# Drop and recreate database
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Restore from backup
gunzip -c "$DB_BACKUP" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
else
    echo -e "${RED}✗ Database restore failed!${NC}"
    echo "Restoring from safety backup..."
    gunzip -c "$SAFETY_BACKUP" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    exit 1
fi
echo ""

# 3. Restore Files (if backup exists)
if [ -f "$FILES_BACKUP" ]; then
    echo "Restoring uploaded files from: $FILES_BACKUP"
    
    # Backup current uploads
    if [ -d "$UPLOAD_DIR" ]; then
        UPLOADS_BACKUP="/tmp/momentum_uploads_pre_restore_$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf "$UPLOADS_BACKUP" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")" 2>/dev/null
        echo -e "${GREEN}✓ Current uploads backed up to: $UPLOADS_BACKUP${NC}"
    fi
    
    # Create upload directory if it doesn't exist
    mkdir -p "$UPLOAD_DIR"
    
    # Clear existing files
    rm -rf "${UPLOAD_DIR:?}"/*
    
    # Extract backup
    tar -xzf "$FILES_BACKUP" -C "$(dirname "$UPLOAD_DIR")"
    
    if [ $? -eq 0 ]; then
        FILE_COUNT=$(find "$UPLOAD_DIR" -type f | wc -l)
        echo -e "${GREEN}✓ Files restored successfully! ($FILE_COUNT files)${NC}"
    else
        echo -e "${RED}✗ Files restore failed!${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No files backup found, skipping file restore${NC}"
fi

unset PGPASSWORD

echo ""
echo -e "${GREEN}======================================"
echo "Restore completed successfully!"
echo "======================================${NC}"
echo "Safety backups stored at:"
echo "  Database: $SAFETY_BACKUP"
[ -f "$UPLOADS_BACKUP" ] && echo "  Files: $UPLOADS_BACKUP"
echo ""
echo "You can delete these safety backups after verifying the restore."

exit 0
