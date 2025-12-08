# How to Use Complete Setup Script - Digital Ocean

## 🚀 One Script Does Everything!

The `do-complete-setup.sh` script automates the entire server setup process.

---

## What It Does (Automatically)

✅ Updates all system packages  
✅ Installs essential tools (curl, git, ufw, fail2ban, htop)  
✅ Creates 'momentum' user (non-root)  
✅ Sets up SSH keys  
✅ Configures firewall (UFW) - ports 22, 80, 443  
✅ Hardens SSH (disables root, password auth)  
✅ Configures Fail2Ban (brute force protection)  
✅ Installs Node.js 24.11.1  
✅ Installs pnpm 9.15.0  
✅ Installs PM2  
✅ Installs PostgreSQL  
✅ Creates database and user  
✅ Applies system hardening  
✅ Enables automatic security updates  
✅ Creates application directory  

---

## Step-by-Step Instructions

### 1. Create New Droplet

1. Login to https://cloud.digitalocean.com
2. Create → Droplets
3. **Image:** Ubuntu 22.04 LTS
4. **Plan:** Basic - 2 GB RAM ($18/month)
5. **Authentication:** Add your SSH key
6. **Hostname:** momentum-emr-production
7. Create Droplet

### 2. Access Console

1. Click your droplet → **Console** (top right)
2. Login as `root` (automatic with SSH key)

### 3. Download and Run Script

**Copy and paste this into the console:**

```bash
# Download the script
curl -O https://raw.githubusercontent.com/YOUR_GITHUB/Momentum-EMR/main/scripts/do-complete-setup.sh

# Make it executable
chmod +x do-complete-setup.sh

# Run the script
bash do-complete-setup.sh
```

**OR upload from your machine:**

On your Windows machine:

```powershell
# Upload script to droplet
scp -i ~/.ssh/digitalocean_emr scripts/do-complete-setup.sh root@YOUR_DROPLET_IP:~/

# Then in DO console:
bash do-complete-setup.sh
```

**OR copy/paste the entire script:**

1. Open `do-complete-setup.sh` in your editor
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. In Digital Ocean console, type: `nano setup.sh`
4. Paste script (right-click)
5. Save: Ctrl+X, Y, Enter
6. Run: `bash setup.sh`

### 4. During Script Execution

The script will ask for 2 things:

**A) Password for 'momentum' user:**
- Enter a strong password
- You'll use this for sudo commands
- Write it down!

**B) PostgreSQL database password:**
- Enter a secure password for database
- This will be saved to `/root/database_credentials.txt`
- Write it down!

### 5. Wait for Completion

Script takes ~5-10 minutes. You'll see:
- Green checkmarks ✓ for each completed step
- Yellow warnings ! for important notes
- Final summary with all information

### 6. Test SSH Connection

**BEFORE closing console**, test from Windows:

```powershell
ssh -i ~/.ssh/digitalocean_emr momentum@YOUR_DROPLET_IP
```

✅ If successful → Close console safely  
❌ If fails → Use console to troubleshoot

---

## After Setup is Complete

### 1. Save Database Credentials

In your SSH session:

```bash
sudo cat /root/database_credentials.txt
```

Copy this information to your password manager!

### 2. Deploy Momentum EMR

```bash
# Clone repository (or upload via SCP)
cd /home/momentum/Momentum_EMR
git clone YOUR_REPO_URL .

# Create .env file
nano apps/web/.env
```

Add environment variables:

```env
DATABASE_URL="postgresql://momentum_user:YOUR_DB_PASSWORD@localhost:5432/momentum_emr"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://your-domain.com"
# ... other variables
```

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate:deploy

# Build application
pnpm build

# Start with PM2
cd apps/web
pm2 start npm --name momentum-emr -- start
pm2 save
pm2 startup
```

### 3. Install Malware Protection (Optional)

```powershell
# From Windows, upload scripts
scp -i ~/.ssh/digitalocean_emr scripts/cpu-watchdog.sh momentum@YOUR_IP:~/
scp -i ~/.ssh/digitalocean_emr scripts/watchdog-install.sh momentum@YOUR_IP:~/
```

```bash
# On server
chmod +x *.sh
sudo ./watchdog-install.sh
```

---

## Verification Checklist

After setup, verify everything:

```bash
# Check Node.js
node --version        # Should show v24.x.x

# Check pnpm
pnpm --version        # Should show 9.15.0

# Check PostgreSQL
sudo systemctl status postgresql

# Check firewall
sudo ufw status

# Check Fail2Ban
sudo fail2ban-client status sshd

# Check SSH is secure
sudo grep "^PermitRootLogin" /etc/ssh/sshd_config
# Should show: PermitRootLogin no

sudo grep "^PasswordAuthentication" /etc/ssh/sshd_config
# Should show: PasswordAuthentication no
```

---

## Troubleshooting

### Script Fails Midway

```bash
# Check error message
# Fix the issue
# Run script again - it will skip completed steps
bash do-complete-setup.sh
```

### Can't Login After Setup

Use Digital Ocean console:
1. Droplets → Your Droplet → Console
2. Login as `momentum` with password you set
3. Check SSH:
   ```bash
   sudo systemctl status sshd
   cat ~/.ssh/authorized_keys
   ```

### Forgot Database Password

```bash
# View saved credentials
sudo cat /root/database_credentials.txt
```

### Need to Reset SSH Config

```bash
# Restore backup
sudo cp /etc/ssh/sshd_config.backup.* /etc/ssh/sshd_config
sudo systemctl restart sshd
```

---

## Script Output Example

```
============================================================
  Momentum EMR - Digital Ocean Complete Setup
  Node.js 24.11.1 | Ubuntu 22.04 | Port 22
============================================================

============================================================
STEP 1: Updating System Packages
============================================================
[✓] System updated successfully

============================================================
STEP 2: Installing Essential Tools
============================================================
[✓] Essential tools installed

... (continues for all 15 steps)

============================================================
  ✓ SETUP COMPLETE!
============================================================

SYSTEM INFORMATION:
-------------------
• Node.js:     v24.11.1
• npm:         11.0.0
• pnpm:        9.15.0
• PM2:         5.x.x
• PostgreSQL:  14.x

SECURITY STATUS:
----------------
• SSH Port:           22 (key-only authentication)
• Root Login:         DISABLED ✓
• Password Auth:      DISABLED ✓
• Firewall (UFW):     ENABLED ✓
• Fail2Ban:           ACTIVE ✓
• Auto Updates:       ENABLED ✓
```

---

## Important Notes

⚠️ **Before closing console:** Test SSH connection!  
⚠️ **Save database password:** It's shown only once  
⚠️ **Keep credentials safe:** Store in password manager  
⚠️ **Script is idempotent:** Safe to run multiple times  

✅ **Script creates:** Complete production-ready server  
✅ **Security hardened:** No known vulnerabilities  
✅ **Ready to deploy:** Just add your application  

---

## Next Documentation

After server setup:
- See **DEPLOY_MOMENTUM_EMR.md** for application deployment
- See **SETUP_NGINX_SSL.md** for web server and HTTPS
- See **PM2_MANAGEMENT.md** for process management

---

**Your server will be production-ready in ~10 minutes!** 🚀
