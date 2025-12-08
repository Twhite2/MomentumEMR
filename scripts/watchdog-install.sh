#!/bin/bash

################################################################################
# Momentum EMR - CPU Watchdog Installation Script
# Description: Installs CPU monitoring service
################################################################################

echo "=========================================="
echo "Momentum EMR - CPU Watchdog Installation"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run with sudo: sudo bash scripts/watchdog-install.sh"
    exit 1
fi

SCRIPT_DIR="/home/momentum/Momentum_EMR/scripts"
WATCHDOG_SCRIPT="$SCRIPT_DIR/cpu-watchdog.sh"

# Step 1: Check if watchdog script exists
if [ ! -f "$WATCHDOG_SCRIPT" ]; then
    echo "❌ Watchdog script not found at: $WATCHDOG_SCRIPT"
    exit 1
fi

echo "✓ Found watchdog script"

# Step 2: Make script executable
chmod +x "$WATCHDOG_SCRIPT"
echo "✓ Made script executable"

# Step 3: Create systemd service file
cat > /etc/systemd/system/momentum-watchdog.service << 'EOF'
[Unit]
Description=Momentum EMR CPU Watchdog - Malware Protection
After=network.target

[Service]
Type=simple
User=root
ExecStart=/home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=false
PrivateTmp=false

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Created systemd service file"

# Step 4: Reload systemd
systemctl daemon-reload
echo "✓ Reloaded systemd"

# Step 5: Enable service (start on boot)
systemctl enable momentum-watchdog.service
echo "✓ Enabled watchdog service"

# Step 6: Start service
systemctl start momentum-watchdog.service
echo "✓ Started watchdog service"

# Step 7: Wait a moment and check status
sleep 2
if systemctl is-active --quiet momentum-watchdog.service; then
    echo ""
    echo "=========================================="
    echo "✅ SUCCESS! Watchdog is now running"
    echo "=========================================="
    echo ""
    echo "Service Status:"
    systemctl status momentum-watchdog.service --no-pager -l
    echo ""
    echo "📊 Monitoring Commands:"
    echo "  - View logs:        sudo journalctl -u momentum-watchdog -f"
    echo "  - View alerts:      tail -f /var/log/momentum-alerts.log"
    echo "  - Check status:     sudo systemctl status momentum-watchdog"
    echo "  - Stop service:     sudo systemctl stop momentum-watchdog"
    echo "  - Restart service:  sudo systemctl restart momentum-watchdog"
    echo ""
    echo "✅ Your server is now protected!"
else
    echo ""
    echo "❌ Service failed to start. Check logs:"
    echo "  sudo journalctl -u momentum-watchdog -n 50"
    exit 1
fi
