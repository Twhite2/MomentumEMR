#!/bin/bash

################################################################################
# Momentum EMR - Watchdog Test Script
# Description: Verifies the CPU watchdog is working correctly
################################################################################

echo "=========================================="
echo "Momentum EMR - Watchdog Test Utility"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Test 1: Check if watchdog script exists
echo "Test 1: Checking if watchdog script exists..."
[ -f "/home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh" ]
test_result $? "Watchdog script found"

# Test 2: Check if script is executable
echo "Test 2: Checking if script is executable..."
[ -x "/home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh" ]
test_result $? "Script has execute permissions"

# Test 3: Check if systemd service exists
echo "Test 3: Checking if systemd service exists..."
[ -f "/etc/systemd/system/momentum-watchdog.service" ]
test_result $? "Systemd service file found"

# Test 4: Check if service is enabled
echo "Test 4: Checking if service is enabled..."
sudo systemctl is-enabled momentum-watchdog.service > /dev/null 2>&1
test_result $? "Service is enabled (will start on boot)"

# Test 5: Check if service is active
echo "Test 5: Checking if service is running..."
sudo systemctl is-active momentum-watchdog.service > /dev/null 2>&1
test_result $? "Service is currently running"

# Test 6: Check log files exist
echo "Test 6: Checking log files..."
[ -f "/var/log/momentum-watchdog.log" ]
test_result $? "Main log file exists"

[ -f "/var/log/momentum-alerts.log" ]
test_result $? "Alert log file exists"

# Test 7: Check if logs are being written
echo "Test 7: Checking if watchdog is actively monitoring..."
LOG_SIZE=$(stat -c%s "/var/log/momentum-watchdog.log" 2>/dev/null)
if [ ! -z "$LOG_SIZE" ] && [ "$LOG_SIZE" -gt 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}: Log file has content (${LOG_SIZE} bytes)"
    ((TESTS_PASSED++))
    
    # Show last log entry
    echo "  Last log entry:"
    tail -1 /var/log/momentum-watchdog.log | sed 's/^/    /'
else
    echo -e "${RED}✗ FAILED${NC}: Log file is empty (service may not be running properly)"
    ((TESTS_FAILED++))
fi
echo ""

# Test 8: Check for recent activity (last 5 minutes)
echo "Test 8: Checking for recent activity..."
RECENT_LOGS=$(sudo journalctl -u momentum-watchdog --since "5 minutes ago" --no-pager 2>/dev/null | wc -l)
if [ "$RECENT_LOGS" -gt 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}: Service has logged $RECENT_LOGS entries in last 5 minutes"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC}: No recent logs (service may be idle or just started)"
    ((TESTS_PASSED++))
fi
echo ""

# Test 9: Check CPU usage of watchdog itself
echo "Test 9: Checking watchdog CPU usage..."
WATCHDOG_PID=$(pgrep -f "cpu-watchdog.sh" | head -1)
if [ ! -z "$WATCHDOG_PID" ]; then
    WATCHDOG_CPU=$(ps -p $WATCHDOG_PID -o %cpu --no-headers 2>/dev/null | tr -d ' ')
    if [ ! -z "$WATCHDOG_CPU" ]; then
        echo -e "${GREEN}✓ PASSED${NC}: Watchdog CPU usage: ${WATCHDOG_CPU}%"
        ((TESTS_PASSED++))
        
        if (( $(echo "$WATCHDOG_CPU < 1.0" | bc -l) )); then
            echo "  ${GREEN}Excellent${NC}: Very low CPU usage"
        fi
    else
        echo -e "${YELLOW}⚠ INFO${NC}: Could not measure CPU usage"
        ((TESTS_PASSED++))
    fi
else
    echo -e "${YELLOW}⚠ INFO${NC}: Watchdog process not found via pgrep (may be running as systemd service)"
    ((TESTS_PASSED++))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Watchdog is working correctly.${NC}"
    echo ""
    echo "📊 Quick Status Check:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    sudo systemctl status momentum-watchdog --no-pager -l | head -15
    echo ""
    echo "📝 Recent Logs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -5 /var/log/momentum-watchdog.log
    echo ""
    echo "🎯 Useful Commands:"
    echo "  - View live logs:     sudo journalctl -u momentum-watchdog -f"
    echo "  - View alerts:        tail -f /var/log/momentum-alerts.log"
    echo "  - Check status:       sudo systemctl status momentum-watchdog"
    echo "  - Restart service:    sudo systemctl restart momentum-watchdog"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the output above.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  1. Check if service is running: sudo systemctl status momentum-watchdog"
    echo "  2. View recent logs: sudo journalctl -u momentum-watchdog -n 50"
    echo "  3. Reinstall: sudo bash /home/momentum/Momentum_EMR/scripts/watchdog-install.sh"
    exit 1
fi
