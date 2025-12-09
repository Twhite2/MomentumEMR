#!/bin/bash
#####################################################################
# Digital Ocean Complete Security Setup - Momentum EMR
# Node.js 24.11.1 | Ubuntu 22.04 LTS | Port 22
# 
# Run as ROOT user in Digital Ocean Console
# Usage: bash do-complete-setup.sh
#####################################################################

set -e  # Exit on error

echo "============================================================"
echo "  Momentum EMR - Digital Ocean Complete Setup"
echo "  Node.js 24.11.1 | Ubuntu 22.04 | Port 22"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

#####################################################################
# STEP 1: Update System
#####################################################################

echo ""
echo "============================================================"
echo "STEP 1: Updating System Packages"
echo "============================================================"

apt update
apt upgrade -y
apt autoremove -y

print_status "System updated successfully"

#####################################################################
# STEP 2: Install Essential Tools
#####################################################################

echo ""
echo "============================================================"
echo "STEP 2: Installing Essential Tools"
echo "============================================================"

apt install -y curl wget git ufw fail2ban htop nano unattended-upgrades

print_status "Essential tools installed"

#####################################################################
# STEP 3: Create Non-Root User
#####################################################################

echo ""
echo "============================================================"
echo "STEP 3: Creating Non-Root User 'momentum'"
echo "============================================================"

# Check if user already exists
if id "momentum" &>/dev/null; then
    print_warning "User 'momentum' already exists, skipping creation"
else
    # Create user with home directory
    adduser --gecos "" --disabled-password momentum
    
    # Set password automatically
    echo "momentum:Baridueh2025@" | chpasswd
    
    print_status "User 'momentum' created with password"
fi

# Add to sudo group
usermod -aG sudo momentum
print_status "User 'momentum' added to sudo group"

#####################################################################
# STEP 4: Setup SSH Keys for New User
#####################################################################

echo ""
echo "============================================================"
echo "STEP 4: Setting Up SSH Keys"
echo "============================================================"

# Create .ssh directory for new user
mkdir -p /home/momentum/.ssh

# Copy authorized_keys from root (if they exist)
if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys /home/momentum/.ssh/
    print_status "SSH keys copied from root"
else
    print_warning "No SSH keys found in /root/.ssh/, you'll need to add them manually"
fi

# Set correct permissions
chown -R momentum:momentum /home/momentum/.ssh
chmod 700 /home/momentum/.ssh
chmod 600 /home/momentum/.ssh/authorized_keys 2>/dev/null || true

print_status "SSH directory configured"

#####################################################################
# STEP 5: Configure Firewall (UFW)
#####################################################################

echo ""
echo "============================================================"
echo "STEP 5: Configuring Firewall (UFW)"
echo "============================================================"

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (port 22)
ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable firewall (answer yes automatically)
echo "y" | ufw enable

print_status "Firewall configured and enabled"
ufw status verbose

#####################################################################
# STEP 6: Harden SSH Configuration
#####################################################################

echo ""
echo "============================================================"
echo "STEP 6: Hardening SSH Configuration"
echo "============================================================"

# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

# Create hardened SSH config
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
# Momentum EMR SSH Hardening
Port 22
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
MaxAuthTries 3
LoginGraceTime 60
AllowUsers momentum
EOF

print_status "SSH configuration hardened"

# Test SSH configuration
if sshd -t; then
    print_status "SSH configuration is valid"
else
    print_error "SSH configuration has errors, restoring backup"
    cp /etc/ssh/sshd_config.backup.$(date +%Y%m%d) /etc/ssh/sshd_config
    exit 1
fi

print_warning "SSH will be restarted at the end of this script"

#####################################################################
# STEP 7: Configure Fail2Ban
#####################################################################

echo ""
echo "============================================================"
echo "STEP 7: Configuring Fail2Ban"
echo "============================================================"

# Create jail.d directory if it doesn't exist
mkdir -p /etc/fail2ban/jail.d

# Create SSH jail configuration
cat > /etc/fail2ban/jail.d/sshd.local << 'EOF'
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

# Enable and start Fail2Ban
systemctl enable fail2ban
systemctl restart fail2ban

print_status "Fail2Ban configured and started"

#####################################################################
# STEP 8: Install Node.js 24
#####################################################################

echo ""
echo "============================================================"
echo "STEP 8: Installing Node.js 24"
echo "============================================================"

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -

# Install Node.js
apt install -y nodejs

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

print_status "Node.js installed: $NODE_VERSION"
print_status "npm installed: $NPM_VERSION"

#####################################################################
# STEP 9: Install pnpm and PM2
#####################################################################

echo ""
echo "============================================================"
echo "STEP 9: Installing pnpm and PM2"
echo "============================================================"

# Install pnpm
npm install -g pnpm@9.15.0

# Install PM2
npm install -g pm2

# Verify installations
PNPM_VERSION=$(pnpm --version)
PM2_VERSION=$(pm2 --version)

print_status "pnpm installed: $PNPM_VERSION"
print_status "PM2 installed: $PM2_VERSION"

#####################################################################
# STEP 10: Install PostgreSQL
#####################################################################

echo ""
echo "============================================================"
echo "STEP 10: Installing PostgreSQL"
echo "============================================================"

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

print_status "PostgreSQL installed and started"

# Create database and user
echo ""
echo "Creating database 'momentum_emr' and user 'momentum_user'..."

# Use same password as user account for simplicity
DB_PASSWORD="Baridueh2025@"

sudo -u postgres psql << EOF
CREATE DATABASE momentum_emr;
CREATE USER momentum_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE momentum_emr TO momentum_user;
ALTER DATABASE momentum_emr OWNER TO momentum_user;
\q
EOF

print_status "Database 'momentum_emr' created"
print_status "User 'momentum_user' created with password"

# Save database info to file (readable only by root)
cat > /root/database_credentials.txt << EOF
Database Name: momentum_emr
Database User: momentum_user
Database Password: $DB_PASSWORD
Connection String: postgresql://momentum_user:$DB_PASSWORD@localhost:5432/momentum_emr
EOF

chmod 600 /root/database_credentials.txt
print_status "Database credentials saved to /root/database_credentials.txt"

#####################################################################
# STEP 11: System Hardening
#####################################################################

echo ""
echo "============================================================"
echo "STEP 11: Applying System Hardening"
echo "============================================================"

# Create sysctl configuration for hardening
cat > /etc/sysctl.d/99-momentum-hardening.conf << 'EOF'
# IP Forwarding
net.ipv4.ip_forward = 0

# SYN Cookies for SYN flood protection
net.ipv4.tcp_syncookies = 1

# Disable ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# Disable IPv6 (if not needed)
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1

# Log suspicious packets
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Ignore ICMP ping requests (optional - uncomment if desired)
# net.ipv4.icmp_echo_ignore_all = 1
EOF

# Apply sysctl settings
sysctl -p /etc/sysctl.d/99-momentum-hardening.conf

print_status "System hardening applied"

#####################################################################
# STEP 12: Configure Automatic Security Updates
#####################################################################

echo ""
echo "============================================================"
echo "STEP 12: Configuring Automatic Security Updates"
echo "============================================================"

# Configure unattended-upgrades
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

# Enable automatic updates
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

print_status "Automatic security updates enabled"

#####################################################################
# STEP 13: Create Application Directory
#####################################################################

echo ""
echo "============================================================"
echo "STEP 13: Creating Application Directory"
echo "============================================================"

# Create app directory
mkdir -p /home/momentum/Momentum_EMR
chown -R momentum:momentum /home/momentum/Momentum_EMR

print_status "Application directory created at /home/momentum/Momentum_EMR"

#####################################################################
# STEP 14: Set File Permissions
#####################################################################

echo ""
echo "============================================================"
echo "STEP 14: Setting Secure File Permissions"
echo "============================================================"

chmod 644 /etc/passwd
chmod 644 /etc/group
chmod 600 /etc/shadow
chmod 600 /etc/gshadow

print_status "File permissions secured"

#####################################################################
# STEP 15: Create Login Banner
#####################################################################

echo ""
echo "============================================================"
echo "STEP 15: Creating Login Banner"
echo "============================================================"

cat > /etc/motd << 'EOF'

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    MOMENTUM EMR PRODUCTION                    ║
║                                                               ║
║  Unauthorized access is prohibited and will be prosecuted    ║
║  All actions are logged and monitored                        ║
║                                                               ║
║  Node.js 24.11.1 | PostgreSQL | Ubuntu 22.04 LTS            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

EOF

print_status "Login banner created"

#####################################################################
# FINAL STEP: Restart Services and Display Summary
#####################################################################

echo ""
echo "============================================================"
echo "FINAL STEP: Restarting Services"
echo "============================================================"

# Restart SSH (this won't disconnect the console)
systemctl restart sshd
print_status "SSH service restarted"

# Restart Fail2Ban
systemctl restart fail2ban
print_status "Fail2Ban service restarted"

#####################################################################
# SUMMARY AND NEXT STEPS
#####################################################################

echo ""
echo "============================================================"
echo "  ✓ SETUP COMPLETE!"
echo "============================================================"
echo ""
echo "SYSTEM INFORMATION:"
echo "-------------------"
echo "• Node.js:     $(node --version)"
echo "• npm:         $(npm --version)"
echo "• pnpm:        $(pnpm --version)"
echo "• PM2:         $(pm2 --version)"
echo "• PostgreSQL:  $(sudo -u postgres psql --version | awk '{print $3}')"
echo ""
echo "SECURITY STATUS:"
echo "----------------"
echo "• SSH Port:           22 (key-only authentication)"
echo "• Root Login:         DISABLED ✓"
echo "• Password Auth:      DISABLED ✓"
echo "• Firewall (UFW):     ENABLED ✓"
echo "• Fail2Ban:           ACTIVE ✓"
echo "• Auto Updates:       ENABLED ✓"
echo ""
echo "DATABASE CREDENTIALS:"
echo "---------------------"
echo "• Database:    momentum_emr"
echo "• User:        momentum_user"
echo "• Password:    Baridueh2025@"
echo "• Connection:  postgresql://momentum_user:Baridueh2025@@localhost:5432/momentum_emr"
echo ""
echo "USER CREDENTIALS:"
echo "-----------------"
echo "• Username:    momentum"
echo "• Password:    Baridueh2025@"
echo "• Purpose:     sudo commands only (NOT for SSH login)"
echo ""
echo "NOTE: Same password used for both user and database for simplicity"
echo ""
echo "SSH ACCESS:"
echo "-----------"
echo "• Method:      SSH key authentication ONLY"
echo "• Password:    NOT used for SSH (disabled for security)"
echo "• Your key:    ~/.ssh/digitalocean_emr"
echo ""
echo "IMPORTANT - NEXT STEPS:"
echo "-----------------------"
echo ""
echo "1. TEST SSH CONNECTION (in a NEW terminal on Windows):"
echo "   ssh -i ~/.ssh/digitalocean_emr momentum@$(curl -s ifconfig.me)"
echo ""
echo "2. If SSH works, you can safely close this console"
echo ""
echo "3. Database credentials (for your .env file):"
echo "   DATABASE_URL=postgresql://momentum_user:Baridueh2025@@localhost:5432/momentum_emr"
echo "   (Also saved in /root/database_credentials.txt)"
echo ""
echo "4. Deploy your application:"
echo "   - Clone repository to /home/momentum/Momentum_EMR"
echo "   - Create .env file with database credentials"
echo "   - Run: pnpm install && pnpm build"
echo "   - Start with PM2: pm2 start npm --name momentum-emr -- start"
echo ""
echo "5. Install malware protection (optional but recommended):"
echo "   - Upload cpu-watchdog.sh and watchdog-install.sh"
echo "   - Run: sudo ./watchdog-install.sh"
echo ""
echo "============================================================"
echo "  Server is now SECURE and ready for deployment!"
echo "============================================================"
echo ""
print_warning "BEFORE closing this console, test SSH connection from Windows!"
echo ""
