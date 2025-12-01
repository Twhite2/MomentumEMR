# Momentum EMR - Subdomain Multi-Tenancy Setup Guide

Complete guide for setting up subdomain-based hospital branding system.

---

## 🎯 Overview

Each hospital gets its own subdomain with custom branding:
- **City General Hospital** → `citygeneralhospital.momentumhealthcare.io`
- **St. Mary's Hospital** → `stmarys.momentumhealthcare.io`
- **Royal Care Center** → `royalcarecenter.momentumhealthcare.io`

**Benefits:**
- ✅ Hospital-specific branding on login page
- ✅ Professional appearance for each hospital
- ✅ Easy to remember URLs
- ✅ Better SEO and brand identity
- ✅ Subdomain auto-generated from hospital name

---

## 📋 Prerequisites

- Vultr server with your application deployed
- Domain name (`momentumhealthcare.io`) pointing to your server
- Access to domain DNS settings (Vultr DNS or domain registrar)
- Database access for running migrations

---

## 🚀 Deployment Steps

### **Step 1: Run Database Migration**

The subdomain field needs to be added to the database.

#### **On Your Local Machine:**

```bash
# Navigate to database package
cd packages/database

# Create migration
pnpm prisma migrate dev --name add_hospital_subdomain

# This will:
# 1. Add subdomain column to hospitals table
# 2. Create unique index on subdomain
# 3. Update Prisma Client types
```

#### **On Production Server (Vultr):**

```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to project
cd /root/Momentum_EMR

# Pull latest code
git pull

# Navigate to database package
cd packages/database

# Run migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### **Step 2: Add Subdomains to Existing Hospitals**

After migration, existing hospitals won't have subdomains. You need to add them:

#### **Option A: Via Database (Quick)**

```sql
-- Connect to PostgreSQL
psql -U momentum_user -d momentum_db

-- Update existing hospitals with subdomains
UPDATE hospitals 
SET subdomain = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'))
WHERE subdomain IS NULL;

-- Example results:
-- "City General Hospital" → "city-general-hospital"
-- "St. Mary's Hospital" → "st-marys-hospital"

-- Verify
SELECT id, name, subdomain FROM hospitals;
```

#### **Option B: Via Admin Panel (Recommended)**

1. Log in as super admin
2. Go to each hospital's edit page
3. Add subdomain manually
4. Save

---

### **Step 3: Configure DNS (Wildcard)**

You need to set up a wildcard DNS record to point all subdomains to your server.

#### **Using Vultr DNS:**

1. **Go to Vultr Dashboard** → DNS
2. **Select your domain** (`momentumhealthcare.io`)
3. **Add DNS Record:**
   - **Type:** A
   - **Name:** `*` (asterisk for wildcard)
   - **Data:** Your server IP address
   - **TTL:** 300 (or default)

**Example:**
```
Type: A
Name: *
Data: 123.456.789.0  (your Vultr server IP)
TTL: 300
```

This creates: `*.momentumhealthcare.io` → Your Server IP

#### **Using External DNS Provider (e.g., Cloudflare, Namecheap):**

1. **Login to your domain registrar**
2. **Go to DNS Management**
3. **Add A Record:**
   ```
   Type: A
   Name: *
   Points to: 123.456.789.0 (your server IP)
   TTL: Automatic or 300
   ```

**DNS Propagation:** Changes may take 5-60 minutes to propagate globally.

---

### **Step 4: Configure nginx for Wildcards**

Your nginx configuration needs to handle wildcard subdomains.

#### **Edit nginx config:**

```bash
sudo nano /etc/nginx/sites-available/momentum-emr
```

#### **Update server block:**

```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Handle wildcard subdomains
    server_name momentumhealthcare.io *.momentumhealthcare.io;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **Test and reload nginx:**

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

### **Step 5: Configure SSL for Wildcards**

#### **Using Certbot (Let's Encrypt):**

```bash
# Install Certbot if not already installed
sudo apt install certbot python3-certbot-nginx

# Obtain wildcard certificate
sudo certbot certonly --manual \
  --preferred-challenges=dns \
  -d momentumhealthcare.io \
  -d *.momentumhealthcare.io
```

**Follow the prompts:**
1. Certbot will ask you to add TXT records to your DNS
2. Add the TXT records as instructed
3. Wait for DNS propagation
4. Press Enter to continue

#### **Update nginx SSL configuration:**

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name momentumhealthcare.io *.momentumhealthcare.io;
    
    ssl_certificate /etc/letsencrypt/live/momentumhealthcare.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/momentumhealthcare.io/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name momentumhealthcare.io *.momentumhealthcare.io;
    return 301 https://$host$request_uri;
}
```

```bash
# Reload nginx
sudo systemctl reload nginx
```

---

### **Step 6: Restart Application**

```bash
# Navigate to project
cd /root/Momentum_EMR

# Stop current process
pm2 stop momentum-emr

# Start with updated code
pm2 start npm --name "momentum-emr" -- start

# Or restart
pm2 restart momentum-emr
```

---

## ✅ Testing & Verification

### **1. Test Subdomain Detection**

```bash
# Test that middleware detects subdomains
curl -H "Host: citygeneralhospital.momentumhealthcare.io" http://localhost:3000/api/branding/public
```

**Expected response:**
```json
{
  "hospital": {
    "id": 1,
    "name": "City General Hospital",
    "subdomain": "citygeneralhospital",
    "logoUrl": "/uploads/logo.png",
    "primaryColor": "#1253b2",
    "secondaryColor": "#729ad2",
    "tagline": "Quality Healthcare for All"
  }
}
```

### **2. Test Login Page Branding**

1. **Open browser**
2. **Navigate to:** `https://citygeneralhospital.momentumhealthcare.io`
3. **Verify:**
   - ✅ Hospital logo displays
   - ✅ Hospital name shows
   - ✅ Custom brand colors applied
   - ✅ Tagline appears

### **3. Test Different Hospitals**

Visit each hospital's subdomain and verify unique branding:
- `https://hospital1.momentumhealthcare.io`
- `https://hospital2.momentumhealthcare.io`

### **4. Test Fallback (Main Domain)**

- **Navigate to:** `https://momentumhealthcare.io`
- **Should show:** Default Momentum EMR branding

---

## 🏥 Creating New Hospitals

When creating a new hospital via the admin panel:

### **Step 1: Fill Hospital Information**
- Hospital Name: `City General Hospital`
- Subdomain: `citygeneralhospital` *(auto-generated, editable)*
- Contact Email, Phone, etc.

### **Step 2: Add Branding**
- Upload logo
- Set primary color
- Set secondary color
- Add tagline

### **Step 3: Save**

The system will:
- ✅ Validate subdomain is unique
- ✅ Create hospital record
- ✅ Create admin account
- ✅ Display login URL: `citygeneralhospital.momentumhealthcare.io`

### **Step 4: Share with Hospital**

Send the hospital admin:
```
Login URL: https://citygeneralhospital.momentumhealthcare.io
Email: admin@hospital.com
Password: (the password you set)
```

---

## 🔧 Troubleshooting

### **Issue: Subdomain doesn't work**

**Check DNS propagation:**
```bash
# Check if wildcard DNS is set
nslookup citygeneralhospital.momentumhealthcare.io

# Should return your server IP
```

**Solutions:**
- Wait for DNS propagation (up to 60 minutes)
- Clear browser DNS cache
- Try incognito/private browsing

### **Issue: Default branding shows instead of hospital branding**

**Check middleware:**
```bash
# Check server logs
pm2 logs momentum-emr

# Look for subdomain detection logs
```

**Solutions:**
- Verify subdomain exists in database
- Check middleware is running
- Restart application

### **Issue: SSL certificate error**

**Solutions:**
```bash
# Renew certificate
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

### **Issue: TypeScript errors about subdomain field**

**This is expected!** After modifying the Prisma schema:

```bash
# Regenerate Prisma Client
cd packages/database
npx prisma generate

# Restart dev server
cd ../..
pnpm dev
```

---

## 📊 Monitoring

### **Check Active Subdomains:**

```sql
SELECT id, name, subdomain, active 
FROM hospitals 
WHERE active = true 
ORDER BY name;
```

### **Monitor DNS queries:**

```bash
# Check nginx access logs
tail -f /var/log/nginx/access.log | grep -E "momentum\.com"
```

### **Application logs:**

```bash
# Watch application logs
pm2 logs momentum-emr --lines 100
```

---

## 🔒 Security Considerations

1. **SSL Required:** Always use HTTPS for subdomains
2. **Subdomain Validation:** Only lowercase alphanumeric and hyphens allowed
3. **Unique Subdomains:** System prevents duplicates
4. **Active Check:** API only returns branding for active hospitals

---

## 💡 Best Practices

### **Subdomain Naming:**
- ✅ Keep it simple: `cityhospital` instead of `city-general-hospital-ltd`
- ✅ Use hospital abbreviation if long: `cgh` for City General Hospital
- ✅ Avoid special characters
- ✅ Make it memorable

### **Branding:**
- Upload high-quality logos (PNG, transparent background)
- Use brand guidelines for colors
- Keep taglines short (< 50 characters)

### **Testing:**
- Test each hospital's subdomain after creation
- Verify branding appears correctly
- Check on different devices/browsers

---

## 📞 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review application logs: `pm2 logs momentum-emr`
3. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify DNS settings in Vultr dashboard

---

## 🎉 Success Checklist

- [ ] Database migration completed
- [ ] Existing hospitals have subdomains
- [ ] Wildcard DNS configured
- [ ] nginx updated and reloaded
- [ ] SSL certificate installed
- [ ] Application restarted
- [ ] Test hospital subdomain works
- [ ] Branding displays correctly
- [ ] Multiple hospitals tested
- [ ] Documentation shared with team

---

**Your subdomain-based multi-tenant system is now live! 🚀**

Each hospital can now access their customized login page at their own subdomain.
