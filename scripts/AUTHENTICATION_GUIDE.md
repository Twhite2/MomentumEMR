# Authentication Guide - Momentum EMR Server

## 🔑 How Authentication Works

### SSH Login (Using Public Key)

**Method:** SSH Key Authentication  
**Password:** NOT USED  
**Your Private Key:** `~/.ssh/digitalocean_emr`

```powershell
# Connect from Windows (no password needed!)
ssh -i ~/.ssh/digitalocean_emr momentum@YOUR_DROPLET_IP

# The server checks your SSH key, NOT a password
```

✅ **Secure:** 4096-bit key = virtually unbreakable  
✅ **Convenient:** No password to type  
✅ **Safe:** Even if password is compromised, SSH still secure  

---

### Sudo Commands (Using Password)

**Password:** `Baridueh2025@`  
**When Used:** Only for `sudo` commands  
**SSH Login:** NO, password is NOT used for SSH

```bash
# After SSH login with key, you'll need password for:
sudo systemctl restart nginx
# Password: Baridueh2025@

sudo nano /etc/ssh/sshd_config
# Password: Baridueh2025@

sudo apt update
# Password: Baridueh2025@
```

---

## 🔒 Security Configuration

### SSH Configuration:
```bash
Port 22                          # Standard SSH port
PermitRootLogin no              # Root cannot login
PasswordAuthentication no        # Passwords DISABLED
PubkeyAuthentication yes        # SSH keys ONLY
AllowUsers momentum             # Only 'momentum' can login
```

### What This Means:

| Action | Requires |
|--------|----------|
| **SSH Login** | ✅ SSH Key (`~/.ssh/digitalocean_emr`) |
| **Sudo Commands** | ✅ Password (`Baridueh2025@`) |
| **Regular Commands** | ❌ Nothing (already logged in) |

---

## 📋 Complete Authentication Flow

### 1. Initial Connection (SSH Key)

```powershell
# From Windows
ssh -i ~/.ssh/digitalocean_emr momentum@YOUR_DROPLET_IP

# Server checks:
# ✓ Do you have the matching private key?
# ✓ Is it in ~/.ssh/authorized_keys?
# ✓ Are you user 'momentum'?

# If all YES → You're logged in!
```

### 2. Running Regular Commands (No Password)

```bash
# Once logged in, these need NO password:
node --version
npm --version
pm2 list
cd /home/momentum
ls -la
pnpm install
```

### 3. Running Privileged Commands (Password Required)

```bash
# These need password (Baridueh2025@):
sudo systemctl restart nginx
sudo ufw status
sudo fail2ban-client status
sudo nano /etc/ssh/sshd_config
sudo apt update
```

---

## 🛡️ Why This is Secure

### Password Authentication DISABLED

Even if someone knows your password `Baridueh2025@`:
- ❌ Cannot SSH into server (key required)
- ❌ Cannot login via console (key required)
- ❌ Cannot brute force SSH (password auth disabled)

### SSH Key Required

To login via SSH, attacker would need:
- ✅ Your private key file (`~/.ssh/digitalocean_emr`)
- ✅ Physical access to your Windows machine
- ✅ Or steal the file somehow

**This is MUCH harder than guessing a password!**

### Defense in Depth

Even with all this security:
- ✅ Firewall blocks all ports except 22, 80, 443
- ✅ Fail2Ban bans IPs after 3 failed attempts
- ✅ Only user 'momentum' can login
- ✅ Root login completely disabled

---

## 📝 Common Scenarios

### Scenario 1: First Time Connecting

```powershell
# Windows PowerShell
ssh -i ~/.ssh/digitalocean_emr momentum@YOUR_DROPLET_IP

# Server: ✓ SSH key validated
# You're logged in!

# Now run:
sudo systemctl status nginx

# Server asks: Password for momentum:
# You type: Baridueh2025@

# Server: ✓ Password correct
# Command executes!
```

### Scenario 2: Forgot to Specify SSH Key

```powershell
# Wrong:
ssh momentum@YOUR_DROPLET_IP

# Error: Permission denied (publickey)
# Why? Didn't specify -i flag with key

# Correct:
ssh -i ~/.ssh/digitalocean_emr momentum@YOUR_DROPLET_IP
```

### Scenario 3: Wrong Private Key

```powershell
ssh -i ~/.ssh/some_other_key momentum@YOUR_DROPLET_IP

# Error: Permission denied (publickey)
# Why? This key's public key not in server's authorized_keys
```

### Scenario 4: Trying Password SSH (Won't Work)

```bash
# Someone tries:
ssh momentum@YOUR_DROPLET_IP
# Tries password: Baridueh2025@

# Server: Permission denied (publickey)
# Why? PasswordAuthentication is disabled!
```

---

## 🔐 Your Credentials Reference

### SSH Connection:
```powershell
Host: YOUR_DROPLET_IP
User: momentum
Key:  ~/.ssh/digitalocean_emr
Port: 22
```

**Connection command:**
```powershell
ssh -i ~/.ssh/digitalocean_emr momentum@YOUR_DROPLET_IP
```

### Sudo Password:
```
Username: momentum
Password: Baridueh2025@
```

### Database:
```
Database: momentum_emr
User:     momentum_user
Password: (set during script - saved in /root/database_credentials.txt)
```

---

## ⚠️ Important Notes

### SSH Password vs Sudo Password

**DIFFERENT USES:**
- **SSH:** Uses KEY (not password)
- **Sudo:** Uses PASSWORD

**Password `Baridueh2025@` is for:**
- ✅ Running `sudo` commands
- ❌ NOT for SSH login

### If You Lose Your SSH Key

**Problem:** Can't login via SSH  
**Solution:** Use Digital Ocean Console
1. Go to Droplets → Your Droplet → Console
2. Login as `momentum`
3. Password: `Baridueh2025@`
4. Add new SSH key to `~/.ssh/authorized_keys`

### If You Forget Sudo Password

**Problem:** Can't run `sudo` commands  
**Solution:** Use Digital Ocean Console as root
1. Go to Droplets → Your Droplet → Console (Access as root)
2. Reset password:
   ```bash
   passwd momentum
   # Enter new password
   ```

---

## 🎯 Quick Reference

```
┌─────────────────────────────────────────────────────────┐
│                  AUTHENTICATION MATRIX                  │
├─────────────────────────┬───────────────────────────────┤
│ SSH Login from Windows  │ ✓ SSH Key                     │
│                         │ ✗ Password (disabled)         │
├─────────────────────────┼───────────────────────────────┤
│ Sudo commands           │ ✓ Password (Baridueh2025@)    │
├─────────────────────────┼───────────────────────────────┤
│ Regular commands        │ ✓ Nothing (already logged in) │
├─────────────────────────┼───────────────────────────────┤
│ Digital Ocean Console   │ ✓ Password (Baridueh2025@)    │
│                         │   (as momentum user)          │
└─────────────────────────┴───────────────────────────────┘
```

---

**Your setup is secure and properly configured!** 🔒✅
