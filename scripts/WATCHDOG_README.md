# 🛡️ Momentum EMR - CPU Watchdog & Malware Protection

Intelligent monitoring system that protects your server from cryptominers and malware **without affecting EMR operations**.

---

## 🎯 What It Does

✅ **Monitors CPU usage** every 30 seconds  
✅ **Whitelists legitimate processes** (Node.js, PostgreSQL, Redis, Nginx, PM2)  
✅ **Kills suspicious processes** using >40% CPU  
✅ **Removes malware executables** from suspicious locations  
✅ **Logs all actions** for audit trail  
✅ **Runs as systemd service** (auto-restart, runs 24/7)  
✅ **Zero downtime** - Never kills EMR or system processes  

---

## 🚀 Quick Installation

### On Your Server:

```bash
# SSH into your server
ssh momentum@136.244.82.34

# Navigate to project
cd /home/momentum/Momentum_EMR

# Run installation script
sudo bash scripts/watchdog-install.sh
```

**That's it!** The watchdog is now running and protecting your server.

---

## 📊 Monitoring & Management

### View Real-Time Logs:
```bash
# Live monitoring
sudo journalctl -u momentum-watchdog -f

# View alerts only
tail -f /var/log/momentum-alerts.log

# View full log
tail -f /var/log/momentum-watchdog.log
```

### Check Service Status:
```bash
# Is it running?
sudo systemctl status momentum-watchdog

# Start/stop/restart
sudo systemctl start momentum-watchdog
sudo systemctl stop momentum-watchdog
sudo systemctl restart momentum-watchdog

# View recent logs
sudo journalctl -u momentum-watchdog -n 100
```

---

## ⚙️ Configuration

Edit the watchdog script to customize:

```bash
sudo nano /home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh
```

### Key Settings:

```bash
# CPU threshold (kill processes above this %)
CPU_THRESHOLD=40

# How often to check (seconds)
CHECK_INTERVAL=30

# Log locations
LOG_FILE="/var/log/momentum-watchdog.log"
ALERT_FILE="/var/log/momentum-alerts.log"
```

**After editing, restart the service:**
```bash
sudo systemctl restart momentum-watchdog
```

---

## 🔍 How It Works

### Detection Priority (in order):

#### 1️⃣ **Known Malware Patterns** (KILL IMMEDIATELY)
```
runnv, linuxsys, xmrig, minerd, cpuminer, etc.
```

#### 2️⃣ **Whitelisted Processes** (ALLOW)
```
node, postgres, redis, nginx, pm2, systemd, etc.
```

#### 3️⃣ **Suspicious Locations** (KILL IF >40% CPU)
```
/tmp/, /var/tmp/, /dev/shm/, ~/.local/, ~/.config/
```

#### 4️⃣ **Unknown High-CPU Processes** (LOG ONLY)
```
Logs unknown processes for manual review
(Can be enabled to auto-kill)
```

---

## 🎓 Example Scenarios

### Scenario 1: Cryptominer Detected
```
[2025-12-08 06:00:15] High CPU detected: PID=12345 NAME=runnv CPU=180%
[2025-12-08 06:00:15] ⚠️ ALERT: MALWARE DETECTED: runnv (PID=12345, CPU=180%)
[2025-12-08 06:00:15] ⚠️ ALERT: KILLING suspicious process: PID=12345 NAME=runnv
[2025-12-08 06:00:15] ✓ Killed process 12345 (runnv)
[2025-12-08 06:00:15] ⚠️ ALERT: Removing malware executable: /tmp/runnv
[2025-12-08 06:00:15] ✓ Removed executable: /tmp/runnv
```

### Scenario 2: Node.js (EMR) High CPU - Allowed
```
[2025-12-08 06:00:30] High CPU detected: PID=20456 NAME=node CPU=65%
[2025-12-08 06:00:30] ✓ Whitelisted process (allowed): node
```

### Scenario 3: PostgreSQL Backup - Allowed
```
[2025-12-08 02:00:00] High CPU detected: PID=18923 NAME=postgres CPU=85%
[2025-12-08 02:00:00] ✓ Whitelisted process (allowed): postgres
```

---

## 🔒 Whitelisted Processes (Safe List)

These processes will **NEVER** be killed, even at high CPU:

- **Node.js** (`node`, `npm`, `pnpm`) - Your EMR application
- **PM2** - Process manager
- **PostgreSQL** (`postgres`) - Database
- **Redis** - Cache server
- **Nginx** - Web server
- **System processes** (`systemd`, `kworker`, `ksoftirqd`, etc.)
- **SSH** (`sshd`, `bash`, `sh`)
- **Package managers** (`apt`, `dpkg`)
- **Monitoring tools** (`htop`, `top`, `ps`, `grep`)

---

## 🚨 Known Malware Patterns (Kill List)

These are **ALWAYS killed** regardless of CPU usage:

- `runnv` - Cryptominer
- `linuxsys` - Cryptominer
- `xmrig` - Monero miner
- `xmr-stak` - Cryptonight miner
- `minerd` - Bitcoin miner
- `cpuminer` - Generic miner
- `ccminer` - CUDA miner
- `cryptonight` - Cryptonight variant

**To add more:**
```bash
sudo nano /home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh

# Find MALWARE_PATTERNS array and add:
MALWARE_PATTERNS=(
    "runnv"
    "your-malware-name-here"
)
```

---

## 📈 Performance Impact

- **CPU Usage:** <0.1% (checks every 30 seconds)
- **Memory:** ~5MB
- **Disk I/O:** Minimal (logs only when suspicious activity detected)
- **Network:** None
- **Impact on EMR:** **Zero** - Whitelisted processes never touched

---

## 🔧 Advanced Configuration

### Enable Auto-Kill of Unknown Processes

By default, unknown high-CPU processes are **logged only**. To enable auto-kill:

```bash
sudo nano /home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh

# Find this line (around line 241):
# kill_process "$pid" "$proc_name" "$cpu" "$exe_path"

# Uncomment it (remove the #):
kill_process "$pid" "$proc_name" "$cpu" "$exe_path"

# Restart service:
sudo systemctl restart momentum-watchdog
```

### Adjust CPU Threshold

```bash
# Lower = More aggressive (catches more, may have false positives)
CPU_THRESHOLD=30

# Higher = Less aggressive (catches only extreme cases)
CPU_THRESHOLD=60
```

### Change Check Interval

```bash
# More frequent (every 15 seconds)
CHECK_INTERVAL=15

# Less frequent (every 60 seconds)
CHECK_INTERVAL=60
```

---

## 📊 Log Rotation

Prevent logs from filling disk:

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/momentum-watchdog

# Add this:
/var/log/momentum-watchdog.log
/var/log/momentum-alerts.log
{
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 root root
}

# Test
sudo logrotate -f /etc/logrotate.d/momentum-watchdog
```

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u momentum-watchdog -n 50

# Check if script is executable
ls -la /home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh

# Make executable
sudo chmod +x /home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh

# Restart
sudo systemctl restart momentum-watchdog
```

### Legitimate Process Being Killed

```bash
# Add to whitelist
sudo nano /home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh

# Find WHITELIST array and add your process:
WHITELIST=(
    "node"
    "your-process-name"  # Add here
)

# Restart
sudo systemctl restart momentum-watchdog
```

### Not Detecting Malware

```bash
# Check logs
tail -f /var/log/momentum-watchdog.log

# Lower CPU threshold
sudo nano /home/momentum/Momentum_EMR/scripts/cpu-watchdog.sh
# Change: CPU_THRESHOLD=20

# Restart
sudo systemctl restart momentum-watchdog
```

---

## ✅ Verification

### Test That It's Working:

```bash
# 1. Check service is running
sudo systemctl status momentum-watchdog

# Should show: Active: active (running)

# 2. Watch logs in real-time
sudo journalctl -u momentum-watchdog -f

# 3. Check recent alerts
tail /var/log/momentum-alerts.log

# 4. Verify it's monitoring
# You should see logs every 30 seconds if there's high CPU activity
```

---

## 🎉 Success Indicators

✅ Service status shows **"active (running)"**  
✅ Logs show regular monitoring activity  
✅ No malware processes in `htop`  
✅ CPU usage stable (<20% baseline)  
✅ EMR application running normally  

---

## 📞 Support

If you need to:
- Add more malware patterns
- Whitelist specific processes
- Adjust sensitivity
- Debug issues

Check the logs first:
```bash
sudo journalctl -u momentum-watchdog -n 100
tail -50 /var/log/momentum-watchdog.log
```

---

## 🎯 Summary

**What you get:**
- 24/7 automated malware protection
- Zero impact on EMR operations
- Comprehensive logging
- Auto-restart on failure
- Easy to customize

**Your server is now protected! 🛡️**
