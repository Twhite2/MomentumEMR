# Momentum EMR - Subdomain System Deployment

Quick deployment guide for the subdomain multi-tenant branding system.

---

## 🎯 What This Does

Enables hospital-specific branding via subdomains:
- `citygeneralhospital.momentumhealthcare.io` → City General Hospital branding
- `stmarys.momentumhealthcare.io` → St. Mary's Hospital branding
- Each hospital sees their logo, colors, and name on the login page

---

## 📋 Pre-Deployment Checklist

Before you deploy, ensure you have:
- ✅ Access to Vultr server
- ✅ Access to domain DNS settings (for momentumhealthcare.io)
- ✅ Git changes committed and pushed
- ✅ Database backup taken (just in case)

---

## 🚀 Deployment Steps (15 minutes)

### **Step 1: Commit and Push Changes**

```bash
# On your local machine
git add .
git commit -m "Add subdomain multi-tenant branding system"
git push origin main
git push momentum main
```

### **Step 2: Deploy to Server**

```bash
# SSH into Vultr server
ssh root@your-server-ip

# Navigate to project
cd /root/Momentum_EMR

# Pull latest code
git pull

# Install dependencies (if any new ones)
pnpm install
```

### **Step 3: Run Database Migration**

```bash
# Navigate to database package
cd packages/database

# Run migration (adds subdomain column)
npx prisma migrate deploy

# Generate Prisma Client (fixes TypeScript errors)
npx prisma generate

# Go back to root
cd ../..
```

### **Step 4: Add Subdomains to Existing Hospitals**

```bash
# Connect to PostgreSQL
psql -U momentum_user -d momentum_emr

# Run the migration SQL
\i SUBDOMAIN_MIGRATION.sql

# Or manually:
UPDATE hospitals 
SET subdomain = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE subdomain IS NULL;

# Verify
SELECT id, name, subdomain FROM hospitals;

# Exit
\q
```

### **Step 5: Configure DNS (One-time setup)**

#### **Option A: Using Vultr DNS**

1. Log in to **Vultr Dashboard**
2. Go to **DNS** section
3. Select domain: `momentumhealthcare.io`
4. Click **Add Record**
5. Configure:
   - **Type:** A
   - **Name:** `*` (asterisk)
   - **Data:** Your Vultr server IP
   - **TTL:** 300
6. Click **Add Record**

#### **Option B: Using External DNS Provider**

If your domain DNS is managed elsewhere (Cloudflare, Namecheap, etc.):

1. Log in to your DNS provider
2. Go to DNS Management for `momentumhealthcare.io`
3. Add an A record:
   - **Name/Host:** `*`
   - **Type:** A
   - **Value/Points to:** Your server IP
   - **TTL:** 300 or Auto

**Wait 5-10 minutes for DNS propagation**

### **Step 6: Update nginx Configuration**

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/momentum-emr

# Update server_name to include wildcard:
# server_name momentumhealthcare.io *.momentumhealthcare.io;

# Save (Ctrl+X, Y, Enter)

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### **Step 7: Setup SSL for Wildcards** (Skip if already done)

```bash
# Install Certbot (if not installed)
sudo apt install certbot python3-certbot-nginx -y

# Get wildcard certificate
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  -d momentumhealthcare.io \
  -d *.momentumhealthcare.io

# Follow prompts to add TXT records to DNS
# After adding TXT records, press Enter to continue

# Update nginx SSL config
sudo nano /etc/nginx/sites-available/momentum-emr

# Ensure SSL paths point to:
# ssl_certificate /etc/letsencrypt/live/momentumhealthcare.io/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/momentumhealthcare.io/privkey.pem;

# Reload nginx
sudo systemctl reload nginx
```

### **Step 8: Restart Application**

```bash
# Stop current process
pm2 stop momentum-emr

# Rebuild (if using production build)
cd /root/Momentum_EMR
pnpm build

# Start application
pm2 start npm --name "momentum-emr" -- start

# Or restart if already configured
pm2 restart momentum-emr

# Check status
pm2 status

# View logs
pm2 logs momentum-emr --lines 50
```

---

## ✅ Testing

### **Quick Test**

```bash
# Test subdomain detection
curl -H "Host: test.momentumhealthcare.io" http://localhost:3000/api/branding/public

# Should return 404 if 'test' hospital doesn't exist
# Or hospital data if it does
```

### **Browser Test**

1. Create a test hospital in admin panel:
   - Name: `Test Hospital`
   - Subdomain: `testhospital`
   - Add logo and colors

2. Visit in browser:
   ```
   https://testhospital.momentumhealthcare.io
   ```

3. Verify:
   - ✅ Custom logo appears
   - ✅ Hospital name shows
   - ✅ Brand colors applied
   - ✅ Tagline displays

---

## 🔧 Troubleshooting

### **DNS not working**

```bash
# Check DNS resolution
nslookup testhospital.momentumhealthcare.io

# Should return your server IP
# If not, wait longer for DNS propagation (up to 1 hour)
```

### **Application errors**

```bash
# Check application logs
pm2 logs momentum-emr

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### **SSL certificate issues**

```bash
# Test certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

---

## 📊 Monitoring

### **Check Application Status**

```bash
# PM2 status
pm2 status

# View logs
pm2 logs momentum-emr --lines 100

# Monitor in real-time
pm2 logs momentum-emr
```

### **Check nginx Status**

```bash
# Status
sudo systemctl status nginx

# Access logs (see subdomain requests)
sudo tail -f /var/log/nginx/access.log | grep momentumhealthcare.io
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Code pulled from Git
- [ ] Database migration completed
- [ ] Existing hospitals have subdomains
- [ ] Wildcard DNS record added
- [ ] nginx configuration updated
- [ ] SSL certificate covers wildcards
- [ ] Application restarted successfully
- [ ] Test hospital subdomain works
- [ ] Branding displays correctly on login
- [ ] Multiple hospitals can be accessed via their subdomains

---

## 🎉 You're Done!

Your multi-tenant subdomain system is now live!

**Next Steps:**
1. Share subdomain URLs with hospital admins
2. Monitor logs for any issues
3. Add more hospitals via the admin panel

**Support:**
- Full guide: See `SUBDOMAIN_SETUP_GUIDE.md`
- Check logs: `pm2 logs momentum-emr`
- DNS issues: Wait 1 hour for propagation

---

**Estimated Total Time:** 15-30 minutes  
**Downtime:** ~2 minutes (during app restart)
