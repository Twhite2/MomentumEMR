#!/bin/bash

################################################################################
# Momentum EMR - CPU Watchdog & Malware Protection
# Description: Monitors CPU usage and kills suspicious high-CPU processes
# Author: Momentum EMR Security Team
# Version: 1.0
################################################################################

# Configuration
CPU_THRESHOLD=40              # Kill processes above this CPU %
CHECK_INTERVAL=30             # Check every 30 seconds
LOG_FILE="/var/log/momentum-watchdog.log"
ALERT_FILE="/var/log/momentum-alerts.log"

# Whitelist of legitimate processes (case-insensitive patterns)
WHITELIST=(
    "node"              # Node.js (EMR application)
    "npm"               # Package manager
    "pnpm"              # Package manager
    "pm2"               # Process manager
    "postgres"          # PostgreSQL database
    "redis"             # Redis server
    "nginx"             # Web server
    "systemd"           # System daemon
    "sshd"              # SSH daemon
    "bash"              # Shell
    "sh"                # Shell
    "grep"              # Search utility
    "ps"                # Process status
    "top"               # Process monitor
    "htop"              # Process monitor
    "apt"               # Package manager
    "dpkg"              # Package manager
    "cron"              # Cron daemon
    "kworker"           # Kernel worker
    "migration"         # Kernel thread
    "ksoftirqd"         # Kernel thread
    "rcu_"              # Kernel RCU threads
    "watchdog"          # This script
    "cpu-watchdog"      # This script
)

# Known malware process names (add more as discovered)
MALWARE_PATTERNS=(
    "runnv"
    "linuxsys"
    "xmrig"
    "xmr-stak"
    "minerd"
    "cpuminer"
    "ccminer"
    "cryptonight"
    "kthreaddi"         # Fake kernel thread
    "systemd-journal"   # Fake systemd (note extra dash)
    "kworker/R-"        # Suspicious kernel worker variant
)

################################################################################
# Logging Functions
################################################################################

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ ALERT: $1" | tee -a "$LOG_FILE" "$ALERT_FILE"
}

################################################################################
# Check if process is whitelisted
################################################################################

is_whitelisted() {
    local proc_name="$1"
    local proc_cmd="$2"
    
    # Check against whitelist patterns
    for pattern in "${WHITELIST[@]}"; do
        if [[ "$proc_name" =~ $pattern ]] || [[ "$proc_cmd" =~ $pattern ]]; then
            return 0  # Whitelisted
        fi
    done
    
    return 1  # Not whitelisted
}

################################################################################
# Check if process matches known malware patterns
################################################################################

is_malware() {
    local proc_name="$1"
    local proc_cmd="$2"
    
    for pattern in "${MALWARE_PATTERNS[@]}"; do
        if [[ "$proc_name" =~ $pattern ]] || [[ "$proc_cmd" =~ $pattern ]]; then
            return 0  # Matches malware pattern
        fi
    done
    
    return 1  # Not malware
}

################################################################################
# Check if process is running from suspicious location
################################################################################

is_suspicious_location() {
    local exe_path="$1"
    
    # Suspicious locations for executables
    local suspicious_paths=(
        "/tmp/"
        "/var/tmp/"
        "/dev/shm/"
        "/home/*/Downloads/"
        "/home/*/.local/"
        "/home/*/.config/"
    )
    
    for path in "${suspicious_paths[@]}"; do
        if [[ "$exe_path" == $path* ]]; then
            return 0  # Suspicious
        fi
    done
    
    return 1  # Normal location
}

################################################################################
# Kill and remove suspicious process
################################################################################

kill_process() {
    local pid="$1"
    local name="$2"
    local cpu="$3"
    local exe_path="$4"
    
    alert "KILLING suspicious process: PID=$pid NAME=$name CPU=${cpu}% PATH=$exe_path"
    
    # Kill the process
    sudo kill -9 "$pid" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log "✓ Killed process $pid ($name)"
    else
        log "✗ Failed to kill process $pid"
        return 1
    fi
    
    # Try to remove the executable if it exists
    if [ -f "$exe_path" ] && [ "$exe_path" != "" ]; then
        if is_suspicious_location "$exe_path"; then
            alert "Removing malware executable: $exe_path"
            sudo rm -f "$exe_path" 2>/dev/null
            
            if [ $? -eq 0 ]; then
                log "✓ Removed executable: $exe_path"
            else
                log "✗ Failed to remove: $exe_path"
            fi
        fi
    fi
    
    # Check for related files
    local exe_dir=$(dirname "$exe_path")
    if is_suspicious_location "$exe_dir/"; then
        log "Scanning directory for related malware: $exe_dir"
        sudo find "$exe_dir" -type f -name "*mine*" -o -name "*xmr*" -o -name "*crypto*" 2>/dev/null | while read -r file; do
            alert "Removing related file: $file"
            sudo rm -f "$file"
        done
    fi
}

################################################################################
# Main monitoring loop
################################################################################

monitor_cpu() {
    log "=========================================="
    log "CPU Watchdog started (Threshold: ${CPU_THRESHOLD}%)"
    log "=========================================="
    
    while true; do
        # Get high CPU processes (excluding header)
        ps aux --sort=-%cpu | awk -v threshold="$CPU_THRESHOLD" 'NR>1 && $3 >= threshold {print $2, $3, $11}' | while read -r pid cpu cmd; do
            
            # Skip if PID is empty
            [ -z "$pid" ] && continue
            
            # Get detailed process info
            proc_name=$(ps -p "$pid" -o comm= 2>/dev/null)
            proc_user=$(ps -p "$pid" -o user= 2>/dev/null)
            proc_cmd=$(ps -p "$pid" -o args= 2>/dev/null)
            
            # Skip if process no longer exists
            [ -z "$proc_name" ] && continue
            
            # Get executable path
            exe_path=$(readlink -f /proc/$pid/exe 2>/dev/null)
            
            # Log high CPU usage
            log "High CPU detected: PID=$pid USER=$proc_user NAME=$proc_name CPU=${cpu}% CMD=$proc_cmd"
            
            # Priority 1: Check if it matches known malware patterns
            if is_malware "$proc_name" "$proc_cmd"; then
                alert "MALWARE DETECTED: $proc_name (PID=$pid, CPU=${cpu}%)"
                kill_process "$pid" "$proc_name" "$cpu" "$exe_path"
                continue
            fi
            
            # Priority 2: Check if it's whitelisted (legitimate process)
            if is_whitelisted "$proc_name" "$proc_cmd"; then
                log "✓ Whitelisted process (allowed): $proc_name"
                continue
            fi
            
            # Priority 3: Check if running from suspicious location
            if is_suspicious_location "$exe_path"; then
                alert "SUSPICIOUS LOCATION: $proc_name running from $exe_path (PID=$pid, CPU=${cpu}%)"
                kill_process "$pid" "$proc_name" "$cpu" "$exe_path"
                continue
            fi
            
            # Priority 4: Unknown process with high CPU (not system user)
            if [[ "$proc_user" != "root" ]] && [[ "$proc_user" != "www-data" ]] && [[ ! "$exe_path" =~ ^/usr/bin/ ]] && [[ ! "$exe_path" =~ ^/bin/ ]]; then
                alert "UNKNOWN HIGH-CPU PROCESS: $proc_name (PID=$pid, USER=$proc_user, CPU=${cpu}%, PATH=$exe_path)"
                
                # Ask if we should kill (log only for now, can enable auto-kill later)
                log "⚠️ Monitoring unknown process. Enable AUTO_KILL_UNKNOWN to kill automatically."
                
                # Uncomment to enable automatic killing of unknown processes:
                # kill_process "$pid" "$proc_name" "$cpu" "$exe_path"
            else
                log "✓ System process (allowed): $proc_name from $exe_path"
            fi
        done
        
        # Sleep before next check
        sleep "$CHECK_INTERVAL"
    done
}

################################################################################
# Startup
################################################################################

# Create log file if it doesn't exist
sudo touch "$LOG_FILE" "$ALERT_FILE"
sudo chmod 644 "$LOG_FILE" "$ALERT_FILE"

# Start monitoring
monitor_cpu
