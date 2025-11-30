#!/bin/bash

# Momentum EMR - Backup Test Script
# Description: Tests backup and restore functionality without affecting production
# Usage: ./scripts/test-backup.sh

echo "======================================"
echo "Momentum EMR - Backup Test Utility"
echo "======================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Check if scripts exist
echo "Test 1: Checking if backup scripts exist..."
[ -f "$SCRIPT_DIR/backup.sh" ]
test_result $? "backup.sh exists"

[ -f "$SCRIPT_DIR/restore.sh" ]
test_result $? "restore.sh exists"

# Test 2: Check if scripts are executable
echo "Test 2: Checking if scripts are executable..."
[ -x "$SCRIPT_DIR/backup.sh" ]
test_result $? "backup.sh is executable"

[ -x "$SCRIPT_DIR/restore.sh" ]
test_result $? "restore.sh is executable"

# Test 3: Check if .backup.env exists
echo "Test 3: Checking environment configuration..."
if [ -f "$SCRIPT_DIR/.backup.env" ]; then
    echo -e "${GREEN}✓ PASSED${NC}: .backup.env exists"
    ((TESTS_PASSED++))
    
    # Test 3b: Check if it has correct permissions
    PERMS=$(stat -c %a "$SCRIPT_DIR/.backup.env" 2>/dev/null || stat -f %A "$SCRIPT_DIR/.backup.env" 2>/dev/null)
    if [ "$PERMS" = "600" ]; then
        echo -e "${GREEN}✓ PASSED${NC}: .backup.env has secure permissions (600)"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: .backup.env permissions are $PERMS (should be 600)"
        echo "  Run: chmod 600 $SCRIPT_DIR/.backup.env"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗ FAILED${NC}: .backup.env not found"
    echo "  Run: cp $SCRIPT_DIR/.backup.env.example $SCRIPT_DIR/.backup.env"
    echo "  Then edit with your database credentials"
    ((TESTS_FAILED++))
    exit 1
fi
echo ""

# Test 4: Load and validate environment variables
echo "Test 4: Validating environment variables..."
source "$SCRIPT_DIR/.backup.env"

[ ! -z "$DB_NAME" ]
test_result $? "DB_NAME is set"

[ ! -z "$DB_USER" ]
test_result $? "DB_USER is set"

[ ! -z "$DB_PASSWORD" ]
test_result $? "DB_PASSWORD is set"

if [ "$DB_PASSWORD" = "YOUR_DATABASE_PASSWORD_HERE" ]; then
    echo -e "${RED}✗ FAILED${NC}: DB_PASSWORD still has placeholder value"
    echo "  Edit $SCRIPT_DIR/.backup.env with your actual database password"
    ((TESTS_FAILED++))
fi

# Test 5: Check PostgreSQL connection
echo "Test 5: Testing database connection..."
export PGPASSWORD="$DB_PASSWORD"
psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
test_result $? "Can connect to PostgreSQL database '$DB_NAME'"
unset PGPASSWORD

# Test 6: Check backup directory
echo "Test 6: Checking backup directory..."
BACKUP_DIR="${BACKUP_DIR:-/var/backups/momentum-emr}"
if [ -d "$BACKUP_DIR" ]; then
    echo -e "${GREEN}✓ PASSED${NC}: Backup directory exists: $BACKUP_DIR"
    ((TESTS_PASSED++))
    
    # Check write permissions
    if [ -w "$BACKUP_DIR" ]; then
        echo -e "${GREEN}✓ PASSED${NC}: Backup directory is writable"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: Backup directory is not writable"
        echo "  Run: mkdir -p $BACKUP_DIR && chmod 700 $BACKUP_DIR"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ INFO${NC}: Backup directory doesn't exist yet (will be created on first backup)"
    echo "  Location: $BACKUP_DIR"
    ((TESTS_PASSED++))
fi
echo ""

# Test 7: Check upload directory
echo "Test 7: Checking upload directory..."
UPLOAD_DIR="${UPLOAD_DIR:-/root/Momentum_EMR/uploads}"
if [ -d "$UPLOAD_DIR" ]; then
    FILE_COUNT=$(find "$UPLOAD_DIR" -type f 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ PASSED${NC}: Upload directory exists: $UPLOAD_DIR"
    echo "  Contains $FILE_COUNT files"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC}: Upload directory not found: $UPLOAD_DIR"
    echo "  File backups will be skipped until this directory is created"
    ((TESTS_PASSED++))
fi
echo ""

# Test 8: Check disk space
echo "Test 8: Checking disk space..."
AVAILABLE_SPACE=$(df -BG "$BACKUP_DIR" 2>/dev/null | awk 'NR==2 {print $4}' | sed 's/G//')
if [ ! -z "$AVAILABLE_SPACE" ]; then
    if [ "$AVAILABLE_SPACE" -gt 10 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: Sufficient disk space (${AVAILABLE_SPACE}GB available)"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Low disk space (${AVAILABLE_SPACE}GB available)"
        echo "  Consider freeing up space or reducing RETENTION_DAYS"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ INFO${NC}: Could not check disk space"
    ((TESTS_PASSED++))
fi
echo ""

# Test 9: Check if cron job is configured
echo "Test 9: Checking cron configuration..."
if crontab -l 2>/dev/null | grep -q "backup.sh"; then
    echo -e "${GREEN}✓ PASSED${NC}: Backup cron job is configured"
    echo "  Current schedule:"
    crontab -l | grep backup.sh | sed 's/^/  /'
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ INFO${NC}: No backup cron job found"
    echo "  To set up automatic backups, run:"
    echo "  crontab -e"
    echo "  Then add: 0 2 * * * $SCRIPT_DIR/backup.sh >> /var/log/momentum-backup.log 2>&1"
    ((TESTS_PASSED++))
fi
echo ""

# Test 10: Check if pg_dump is available
echo "Test 10: Checking required tools..."
command -v pg_dump > /dev/null 2>&1
test_result $? "pg_dump is installed"

command -v psql > /dev/null 2>&1
test_result $? "psql is installed"

command -v gzip > /dev/null 2>&1
test_result $? "gzip is installed"

command -v tar > /dev/null 2>&1
test_result $? "tar is installed"

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Your backup system is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run a test backup: ./scripts/backup.sh"
    echo "  2. Check backup files: ls -lh $BACKUP_DIR"
    echo "  3. Set up cron job for automatic backups"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi
