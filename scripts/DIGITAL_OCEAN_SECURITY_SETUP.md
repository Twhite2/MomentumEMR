# Digital Ocean Security Setup Guide - Momentum EMR

## ✅ Perfect! You're Using Node.js 24.11.1

Your local machine is now running Node 24.11.1, which will match your Digital Ocean production server.

---

## Complete Security Setup for Digital Ocean

### Prerequisites
- ✅ Node.js 24.11.1 tested locally (done!)
- ✅ Digital Ocean account
- ✅ SSH key generated (see DIGITAL_OCEAN_SSH_SETUP.md)

---

## Part 1: Create Secure Droplet

### Step 1: Create Droplet via Digital Ocean Console

1. **Login to Digital Ocean**
   - Go to https://cloud.digitalocean.com
   - Click **Create** → **Droplets**

2. **Choose Image**
   - **Distribution:** Ubuntu 22.04 LTS (recommended)
   - **Version:** 22.04 x64

3. **Choose Droplet Size**
   ```
   RECOMMENDED FOR MOMENTUM EMR:
   
   Basic Plan - Regular
   • 2 vCPUs
   • 2 GB RAM
   • 50 GB SSD
   • $18/month
   
   OR for better performance:
   
   Basic Plan - Regular  
   • 2 vCPUs
   • 4 GB RAM
   • 80 GB SSD
   • $24/month
   ```

4. **Choose Datacenter Region**
   - Select closest to your users
   - Examples:
     - `NYC3` (New York) - For US/Americas
     - `LON1` (London) - For Europe/Africa
     - `SGP1` (Singapore) - For Asia

5. **Authentication**
   - ✅ Select **SSH keys**
   - ✅ Check your uploaded SSH key
   - ❌ **DO NOT** use password authentication

6. **Finalize Details**
   - **Hostname:** `momentum-emr-production`
   - **Tags:** `production`, `emr`, `nodejs24`
   - **Backups:** ✅ Enable automated backups ($3.60/month extra)
   - **Monitoring:** ✅ Enable free monitoring

7. **Click "Create Droplet"**

---

## Part 2: Initial Server Security (Use Digital Ocean Console)

### Access Droplet Console

1. Go to **Droplets** → Click your droplet name
2. Click **Console** (top right) or **Access** → **Launch Droplet Console**
3. Login as `root` (no password needed - uses SSH key)

### Step 1: Update System

```bash
# Update package lists
apt update

# Upgrade all packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git ufw fail2ban htop
```

### Step 2: Create Non-Root User

```bash
# Create new user
adduser momentum

# Follow prompts:
# - Enter password (use strong password!)
# - Full Name: Momentum EMR Admin
# - Press Enter for other fields

# Add user to sudo group
usermod -aG sudo momentum

# Setup SSH for new user
mkdir -p /home/momentum/.ssh
cp ~/.ssh/authorized_keys /home/momentum/.ssh/
chown -R momentum:momentum /home/momentum/.ssh
chmod 700 /home/momentum/.ssh
chmod 600 /home/momentum/.ssh/authorized_keys
```

### Step 3: Configure Firewall (UFW)

```bash
# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH on custom port (we'll use 2222)
ufw allow 2222/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status verbose
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
2222/tcp                   ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### Step 4: Harden SSH Configuration

```bash
# Backup original SSH config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
nano /etc/ssh/sshd_config
```

**Make these changes:**

```bash
# Find and modify these lines:

# Change SSH port from 22 to 2222
Port 2222

# Disable root login
PermitRootLogin no

# Enable public key authentication
PubkeyAuthentication yes

# Disable password authentication
PasswordAuthentication no

# Disable empty passwords
PermitEmptyPasswords no

# Disable X11 forwarding
X11Forwarding no

# Set max authentication attempts
MaxAuthTries 3

# Set login grace time
LoginGraceTime 60

# Allow only specific user
AllowUsers momentum

# Use only SSH protocol 2
Protocol 2
```

**Save and exit:** `Ctrl+X`, `Y`, `Enter`

### Step 5: Test SSH Config and Restart

```bash
# Test SSH configuration for errors
sshd -t

# If no errors, restart SSH
systemctl restart sshd

# Check SSH status
systemctl status sshd
```

⚠️ **IMPORTANT: Before logging out, test new SSH connection!**

### Step 6: Test New SSH Connection

**Open NEW terminal on your Windows machine:**

```powershell
# Test SSH with new port and user
ssh -i ~/.ssh/digitalocean_emr -p 2222 momentum@YOUR_DROPLET_IP

# If successful, you're connected securely!
```

✅ **Only after confirming new connection works, close root console session**

---

## Part 3: Install Fail2Ban (Brute Force Protection)

Back in your SSH session as `momentum`:

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit config
sudo nano /etc/fail2ban/jail.local
```

**Configure Fail2Ban:**

Find the `[sshd]` section and modify:

```ini
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

**Save and exit**

```bash
# Enable and start Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status sshd
```

---

## Part 4: Install Node.js 24 and Dependencies

```bash
# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash -
sudo apt install nodejs -y

# Verify installation
node --version
# Should show: v24.11.1

npm --version
# Should show: 11.x.x

# Install pnpm
sudo npm install -g pnpm@9.15.0

# Install PM2
sudo npm install -g pm2

# Verify
pnpm --version
pm2 --version
```

---

## Part 5: Install PostgreSQL Database

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE momentum_emr;
CREATE USER momentum_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE momentum_emr TO momentum_user;
\q

# Test connection
psql -h localhost -U momentum_user -d momentum_emr
# Enter password when prompted
# Type \q to exit
```

---

## Part 6: Deploy Malware Protection Scripts

```bash
# Create scripts directory
mkdir -p ~/Momentum_EMR/scripts

# Upload malware protection scripts
# (We'll upload from your local machine)
```

**On your Windows machine, upload the scripts:**

```powershell
# Navigate to your project
cd C:\Users\PC\Documents\Momentum\EMR

# Upload malware protection scripts
scp -i ~/.ssh/digitalocean_emr -P 2222 scripts/cpu-watchdog.sh momentum@YOUR_DROPLET_IP:~/Momentum_EMR/scripts/
scp -i ~/.ssh/digitalocean_emr -P 2222 scripts/watchdog-install.sh momentum@YOUR_DROPLET_IP:~/Momentum_EMR/scripts/
scp -i ~/.ssh/digitalocean_emr -P 2222 scripts/kill-malware-protect-app.sh momentum@YOUR_DROPLET_IP:~/Momentum_EMR/scripts/
```

**Back on the droplet:**

```bash
# Make scripts executable
chmod +x ~/Momentum_EMR/scripts/*.sh

# Install CPU watchdog
cd ~/Momentum_EMR/scripts
sudo ./watchdog-install.sh

# Verify watchdog is running
sudo systemctl status cpu-watchdog
```

---

## Part 7: Setup Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Configure automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
# Select "Yes"

# Check configuration
cat /etc/apt/apt.conf.d/20auto-upgrades
```

**Expected output:**
```
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

---

## Part 8: Setup Monitoring and Alerts

### Install and Configure Netdata (Optional - Real-time Monitoring)

```bash
# Install Netdata
bash <(curl -Ss https://my-netdata.io/kickstart.sh) --stable-channel --disable-telemetry

# Access Netdata
# http://YOUR_DROPLET_IP:19999

# Secure Netdata with firewall (only allow from your IP)
sudo ufw allow from YOUR_HOME_IP to any port 19999
```

### Setup Email Alerts (Optional)

```bash
# Install mail utilities
sudo apt install mailutils -y

# Configure mail alerts for Fail2Ban
sudo nano /etc/fail2ban/jail.local

# Add under [DEFAULT]:
destemail = your-email@example.com
sendername = Fail2Ban-MomentumEMR
action = %(action_mwl)s
```

---

## Part 9: Security Hardening Checklist

Run these additional security measures:

```bash
# Disable IPv6 (if not needed)
echo "net.ipv6.conf.all.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.conf
echo "net.ipv6.conf.default.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Enable IP forwarding protection
echo "net.ipv4.ip_forward = 0" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Protect against SYN flood attacks
echo "net.ipv4.tcp_syncookies = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Disable ICMP redirects
echo "net.ipv4.conf.all.accept_redirects = 0" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Set file permissions
sudo chmod 644 /etc/passwd
sudo chmod 644 /etc/group
sudo chmod 600 /etc/shadow
sudo chmod 600 /etc/gshadow
```

---

## Part 10: Setup SSH Config on Your Local Machine

**On your Windows machine**, create SSH config for easier access:

```powershell
# Create/edit SSH config
notepad ~\.ssh\config
```

**Add this configuration:**

```
Host momentum-do
    HostName YOUR_DROPLET_IP
    User momentum
    Port 2222
    IdentityFile ~/.ssh/digitalocean_emr
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Now connect easily:**

```powershell
ssh momentum-do
```

---

## Security Verification Checklist

After setup, verify everything:

```bash
# Check firewall
sudo ufw status verbose

# Check SSH is on port 2222
sudo netstat -tlnp | grep :2222

# Check Fail2Ban status
sudo fail2ban-client status

# Check CPU watchdog
sudo systemctl status cpu-watchdog

# Check for listening ports
sudo netstat -tulpn

# Check running processes
htop

# Check last logins
last -a

# Check failed login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20
```

### Expected Secure State:

✅ SSH on port 2222 (not 22)  
✅ Root login disabled  
✅ Password authentication disabled  
✅ Firewall active (only 2222, 80, 443 open)  
✅ Fail2Ban active  
✅ CPU watchdog running  
✅ PostgreSQL installed  
✅ Node.js 24.11.1 installed  
✅ Automatic security updates enabled  

---

## Common Security Commands Reference

```bash
# View firewall rules
sudo ufw status numbered

# Remove firewall rule
sudo ufw delete <number>

# Check Fail2Ban jails
sudo fail2ban-client status

# Unban an IP
sudo fail2ban-client set sshd unbanip IP_ADDRESS

# View SSH logs
sudo tail -f /var/log/auth.log

# Check CPU usage
htop

# Check disk usage
df -h

# Check memory usage
free -h

# View running services
sudo systemctl list-units --type=service --state=running

# Restart services
sudo systemctl restart sshd
sudo systemctl restart fail2ban
sudo systemctl restart cpu-watchdog
```

---

## Next Steps After Security Setup

1. ✅ Server is now secured
2. ⏭️ Clone Momentum EMR repository
3. ⏭️ Configure environment variables (.env)
4. ⏭️ Restore database backup
5. ⏭️ Build and deploy application
6. ⏭️ Setup nginx reverse proxy
7. ⏭️ Configure SSL with Let's Encrypt
8. ⏭️ Setup PM2 for Node.js app

**See DIGITAL_OCEAN_DEPLOYMENT.md for application deployment steps!**

---

## Emergency Access

If you get locked out:

1. **Use Digital Ocean Console** (web-based)
   - Go to Droplets → Your Droplet → Access → Launch Droplet Console
   - Login as `momentum` user with password

2. **Check SSH service:**
   ```bash
   sudo systemctl status sshd
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   ```

4. **Temporarily allow SSH on port 22:**
   ```bash
   sudo ufw allow 22/tcp
   sudo nano /etc/ssh/sshd_config
   # Change Port 2222 back to Port 22
   sudo systemctl restart sshd
   ```

---

## Security Maintenance Schedule

**Daily:**
- Check `sudo fail2ban-client status` for attacks
- Monitor CPU watchdog logs

**Weekly:**
- Review `/var/log/auth.log` for suspicious activity
- Check `df -h` for disk usage
- Update packages: `sudo apt update && sudo apt upgrade`

**Monthly:**
- Review firewall rules
- Rotate passwords if needed
- Check backup integrity
- Review PM2 logs

---

**Your Digital Ocean droplet is now production-ready and secure!** 🔒🚀
