# Digital Ocean SSH Key Setup Guide

## Step 1: Generate SSH Key on Windows

Open **PowerShell** and run:

```powershell
# Navigate to .ssh directory (creates if doesn't exist)
cd ~\.ssh

# Generate ED25519 SSH key (recommended - more secure and faster than RSA)
ssh-keygen -t ed25519 -C "momentum-emr-digitalocean" -f digitalocean_emr

# Alternative: RSA 4096-bit (if ED25519 not supported)
# ssh-keygen -t rsa -b 4096 -C "momentum-emr-digitalocean" -f digitalocean_emr
```

**When prompted:**
- Enter a **strong passphrase** (recommended for security)
- Or press Enter twice for no passphrase (less secure but easier)

This creates:
- `digitalocean_emr` - Private key (keep secret!)
- `digitalocean_emr.pub` - Public key (add to Digital Ocean)

---

## Step 2: View Your Public Key

```powershell
# Display public key to copy
Get-Content ~\.ssh\digitalocean_emr.pub
```

**Copy the entire output** (starts with `ssh-ed25519` or `ssh-rsa`)

---

## Step 3: Add SSH Key to Digital Ocean

### Via Digital Ocean Dashboard:

1. Log into https://cloud.digitalocean.com
2. Click **Settings** → **Security** → **SSH Keys**
3. Click **Add SSH Key**
4. Paste your public key
5. Name it: `Momentum EMR - Main Key`
6. Click **Add SSH Key**

### Via CLI (doctl):

```powershell
# Install Digital Ocean CLI (if not installed)
# Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Add SSH key
doctl compute ssh-key create "Momentum-EMR-Main" --public-key (Get-Content ~\.ssh\digitalocean_emr.pub)
```

---

## Step 4: Create Digital Ocean Droplet with SSH Key

### Via Dashboard:
1. Click **Create** → **Droplets**
2. Choose:
   - **Image:** Ubuntu 22.04 LTS (recommended)
   - **Plan:** Basic (2GB RAM minimum for EMR)
   - **Datacenter:** Choose closest region
3. **Authentication:** Select your SSH key
4. **Hostname:** `momentum-emr-production`
5. Click **Create Droplet**

### Via CLI:
```bash
doctl compute droplet create momentum-emr \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-2gb \
  --region nyc3 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header) \
  --enable-monitoring \
  --enable-ipv6
```

---

## Step 5: Connect to Your Droplet

### Get Droplet IP:
```powershell
# Via dashboard: Copy IP from droplet list
# Via CLI:
doctl compute droplet list
```

### SSH Connection:
```powershell
# SSH using your private key
ssh -i ~\.ssh\digitalocean_emr root@YOUR_DROPLET_IP
```

### Configure SSH Config (Optional - Easier Connection):

Create/edit `~\.ssh\config`:
```
Host momentum-do
    HostName YOUR_DROPLET_IP
    User root
    IdentityFile ~\.ssh\digitalocean_emr
    Port 22
```

Then connect simply with:
```powershell
ssh momentum-do
```

---

## Step 6: Initial Server Setup

Once connected to your droplet:

```bash
# Update system
apt update && apt upgrade -y

# Create non-root user
adduser momentum
usermod -aG sudo momentum

# Setup SSH for new user
mkdir -p /home/momentum/.ssh
cp ~/.ssh/authorized_keys /home/momentum/.ssh/
chown -R momentum:momentum /home/momentum/.ssh
chmod 700 /home/momentum/.ssh
chmod 600 /home/momentum/.ssh/authorized_keys

# Test new user (in new terminal)
ssh -i ~\.ssh\digitalocean_emr momentum@YOUR_DROPLET_IP

# If successful, disable root login
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd
```

---

## Security Best Practices

### 1. Change SSH Port (Recommended)
```bash
sudo nano /etc/ssh/sshd_config
# Change: Port 2222
sudo systemctl restart sshd

# Update firewall
sudo ufw allow 2222/tcp
sudo ufw enable
```

### 2. Install Fail2Ban (Prevent Brute Force)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Setup Firewall (UFW)
```bash
# Allow SSH (use your custom port if changed)
sudo ufw allow 2222/tcp

# Allow HTTP/HTTPS (for your EMR app)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

---

## Digital Ocean vs Vultr - Migration Checklist

### What to Transfer:
- [ ] Database backup (`scripts/backup.sh`)
- [ ] `.env` files with credentials
- [ ] Uploaded files (patient photos, documents)
- [ ] SSL certificates (if using custom domain)
- [ ] PM2 ecosystem config

### Steps:
1. **Backup Vultr server:**
   ```bash
   cd ~/Momentum_EMR/scripts
   ./backup.sh
   ```

2. **Download backups:**
   ```bash
   scp -P 2222 momentum@VULTR_IP:/var/backups/momentum-emr/*.gz ~/Desktop/
   ```

3. **Upload to Digital Ocean:**
   ```bash
   scp -i ~\.ssh\digitalocean_emr ~/Desktop/*.gz momentum@DO_IP:/tmp/
   ```

4. **Restore on Digital Ocean:**
   ```bash
   cd ~/Momentum_EMR/scripts
   ./restore.sh
   ```

---

## Useful Commands

### SSH Key Management:
```powershell
# List all SSH keys
ls ~\.ssh

# View public key
Get-Content ~\.ssh\digitalocean_emr.pub

# Test SSH connection (verbose)
ssh -v -i ~\.ssh\digitalocean_emr root@YOUR_DROPLET_IP

# Add key to ssh-agent (Windows)
ssh-add ~\.ssh\digitalocean_emr
```

### Digital Ocean CLI (doctl):
```bash
# List droplets
doctl compute droplet list

# Get droplet info
doctl compute droplet get DROPLET_ID

# List SSH keys
doctl compute ssh-key list

# Create snapshot
doctl compute droplet-action snapshot DROPLET_ID --snapshot-name "emr-backup-2025-12-08"
```

---

## Troubleshooting

### "Permission denied (publickey)"
```powershell
# Check key permissions
icacls ~\.ssh\digitalocean_emr
# Should be: Only you have full access

# Fix permissions (Windows)
icacls ~\.ssh\digitalocean_emr /inheritance:r
icacls ~\.ssh\digitalocean_emr /grant:r "$($env:USERNAME):(F)"
```

### "Connection timed out"
- Check firewall allows SSH port
- Verify droplet IP is correct
- Check Digital Ocean firewall rules

### Wrong User
```bash
# Use root initially, then switch to momentum
ssh -i ~\.ssh\digitalocean_emr root@YOUR_DROPLET_IP
# After setup:
ssh -i ~\.ssh\digitalocean_emr momentum@YOUR_DROPLET_IP
```

---

## Next Steps After Droplet Created

1. ✅ Generate SSH key (this guide)
2. ✅ Create Digital Ocean droplet
3. ⏭️ Run initial server setup
4. ⏭️ Install Node.js, PostgreSQL, nginx
5. ⏭️ Clone Momentum EMR repository
6. ⏭️ Restore database backup
7. ⏭️ Configure environment variables
8. ⏭️ Setup PM2 and start application
9. ⏭️ Configure domain/SSL (Caddy or Certbot)
10. ⏭️ Install malware protection scripts

---

**Resources:**
- Digital Ocean Docs: https://docs.digitalocean.com
- SSH Best Practices: https://www.digitalocean.com/community/tutorials/ssh-essentials-working-with-ssh-servers-clients-and-keys
