#!/bin/bash
###############################################################################
# QUICK FIX - Kill npm malware and start monitoring
###############################################################################

echo "======================================"
echo "Quick Malware Fix & Monitor Setup"
echo "======================================"

cd ~/Momentum_EMR/scripts || exit 1

# Make scripts executable
chmod +x kill-malware-protect-app.sh
chmod +x monitor-and-kill-malware.sh

# Run the cleanup
echo ""
echo "Step 1: Running full cleanup..."
sudo ./kill-malware-protect-app.sh

# Check if monitoring is already running
if pgrep -f "monitor-and-kill-malware.sh" > /dev/null; then
    echo ""
    echo "Malware monitor is already running"
else
    echo ""
    echo "Step 2: Starting continuous monitor..."
    nohup sudo ./monitor-and-kill-malware.sh > /var/log/malware-monitor.log 2>&1 &
    echo "✓ Monitor started (PID: $!)"
fi

echo ""
echo "======================================"
echo "✓ Done!"
echo "======================================"
echo ""
echo "Check status:"
echo "  PM2:     pm2 status"
echo "  CPU:     htop"
echo "  Logs:    tail -f /var/log/malware-cleanup.log"
echo "  Monitor: tail -f /var/log/malware-monitor.log"
echo ""
echo "Stop monitor:"
echo "  sudo pkill -f monitor-and-kill-malware"
echo ""
