# Momentum EMR - Vultr Ubuntu 22.04 Deployment Guide

## Prerequisites Checklist
- ✅ Vultr Ubuntu 22.04 server
- ✅ SSH access
- ✅ Node.js, npm, and pnpm installed
- ✅ Project cloned in `/root/EMR`
- ✅ `/root/www` folder created

---

## Step 1: Install Required Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally (process manager)
sudo npm install -g pm2

# Install build essentials (for native dependencies)
sudo apt install build-essential -y
```

---

## Step 2: Configure PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL shell, run:
CREATE DATABASE momentum_emr;
CREATE USER momentum_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE momentum_emr TO momentum_user;
ALTER DATABASE momentum_emr OWNER TO momentum_user;
\q

# Test connection
psql -U momentum_user -d momentum_emr -h localhost
# Enter password when prompted, then exit with \q
```

---

## Step 3: Set Up Environment Variables

```bash
# Navigate to project directory
cd /root/EMR

# Create production environment file
nano apps/web/.env.production
```

**Add the following (replace with your actual values):**

```env
# Database
DATABASE_URL="postgresql://momentum_user:your_secure_password_here@localhost:5432/momentum_emr?schema=public"

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate_a_random_32_character_string_here

# Environment
NODE_ENV=production
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Step 4: Install Project Dependencies

```bash
cd /root/EMR

# Install all dependencies
pnpm install

# Generate Prisma Client
cd packages/database
pnpm generate
cd ../..
```

---

## Step 5: Run Database Migrations

```bash
# Apply database schema
cd packages/database
pnpm prisma db push

# Optional: Seed database with initial data
pnpm prisma db seed

cd ../..
```

---

## Step 6: Build the Application

```bash
# Build all packages
pnpm build

# If build fails, check logs for errors
# Common issues: TypeScript errors, missing env variables
```

---

## Step 7: Set Up PM2 Process Manager

```bash
# Navigate to web app directory
cd /root/EMR/apps/web

# Start the application with PM2
pm2 start npm --name "momentum-emr" -- start

# Configure PM2 to start on system reboot
pm2 startup systemd
# Copy and run the command PM2 outputs

pm2 save

# Check status
pm2 status
pm2 logs momentum-emr

# Useful PM2 commands:
# pm2 restart momentum-emr
# pm2 stop momentum-emr
# pm2 delete momentum-emr
# pm2 logs momentum-emr --lines 100
```

---

## Step 8: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/momentum-emr
```

**Add the following configuration:**

```nginx
server {
    listen 80;
    server_name momentumhealthcare.io www.momentumhealthcare.io;

    # Redirect HTTP to HTTPS (after SSL is set up)
    # return 301 https://$server_name$request_uri;

    # Temporarily allow HTTP for testing
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
        
        # Increase timeout for large requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase client body size for file uploads
    client_max_body_size 50M;
}
```

**Enable the site:**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/momentum-emr /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 9: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 10: Set Up SSL/TLS with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d momentumhealthcare.io -d www.momentumhealthcare.io

# Test automatic renewal
sudo certbot renew --dry-run

# Certificates auto-renew, but you can manually renew with:
# sudo certbot renew
```

---

## Step 11: Update Nginx for HTTPS (After SSL Setup)

```bash
sudo nano /etc/nginx/sites-available/momentum-emr
```

**Update to redirect HTTP to HTTPS:**
```nginx
server {
    listen 80;
    server_name momentumhealthcare.io www.momentumhealthcare.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name momentumhealthcare.io www.momentumhealthcare.io;

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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 50M;
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 12: Create Initial Admin User

```bash
# SSH into your server
cd /root/EMR/packages/database

# Run Prisma Studio to create users (temporarily)
pnpm prisma studio

# Or use a seed script
# Create a file: prisma/seed-admin.ts
```

**Create seed-admin.ts:**
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('your_secure_admin_password', 10);
  
  // Create hospital first
  const hospital = await prisma.hospital.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Main Hospital',
      address: '123 Hospital Street',
      phone: '+234-XXX-XXX-XXXX',
      email: 'admin@hospital.com',
      active: true,
    },
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { 
      hospitalId_email: {
        hospitalId: hospital.id,
        email: 'admin@yourhospital.com'
      }
    },
    update: {},
    create: {
      hospitalId: hospital.id,
      name: 'System Administrator',
      email: 'admin@yourhospital.com',
      hashedPassword,
      role: 'admin',
      active: true,
    },
  });

  console.log('Admin user created:', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```bash
# Run the seed
pnpm tsx prisma/seed-admin.ts
```

---

## Step 13: Verify Deployment

```bash
# Check PM2 status
pm2 status
pm2 logs momentum-emr

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql

# Test application
curl http://localhost:3000
# Should return Next.js response

# Test external access
curl http://yourdomain.com
```

---

## Maintenance Commands

### View Logs
```bash
# PM2 logs
pm2 logs momentum-emr
pm2 logs momentum-emr --lines 200

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Update Application
```bash
cd /root/EMR

# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Run migrations
cd packages/database
pnpm prisma db push
cd ../..

# Rebuild
pnpm build

# Restart application
pm2 restart momentum-emr
```

### Database Backup
```bash
# Create backup
pg_dump -U momentum_user momentum_emr > /root/backups/emr_backup_$(date +%Y%m%d).sql

# Restore backup
psql -U momentum_user momentum_emr < /root/backups/emr_backup_20250101.sql

# Automated backup script
sudo nano /root/backup-db.sh
```

**backup-db.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="emr_backup_$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -U momentum_user momentum_emr > $BACKUP_DIR/$FILENAME

# Keep only last 7 days of backups
find $BACKUP_DIR -name "emr_backup_*.sql" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

```bash
chmod +x /root/backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add line:
0 2 * * * /root/backup-db.sh
```

---

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs momentum-emr

# Common issues:
# 1. Database connection - check DATABASE_URL
# 2. Port 3000 in use - check with: sudo lsof -i :3000
# 3. Missing dependencies - run: pnpm install
# 4. Build errors - run: pnpm build
```

### Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart momentum-emr
sudo systemctl restart nginx
```

### Database connection errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U momentum_user -d momentum_emr -h localhost

# Check DATABASE_URL in .env.production
```

### High memory usage
```bash
# Check process memory
pm2 monit

# Restart if needed
pm2 restart momentum-emr

# Configure PM2 max memory
pm2 start npm --name "momentum-emr" --max-memory-restart 500M -- start
pm2 save
```

---

## Security Checklist

- [ ] PostgreSQL uses strong password
- [ ] NEXTAUTH_SECRET is random and secure
- [ ] Firewall (UFW) is enabled
- [ ] SSL/TLS certificate installed
- [ ] SSH uses key-based authentication (not password)
- [ ] Root login disabled in SSH
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Database backups automated
- [ ] Demo credentials removed from login page ✅
- [ ] Admin user uses strong password

---

## Performance Optimization

### Enable PM2 Clustering
```bash
# Use multiple instances for better performance
pm2 delete momentum-emr
pm2 start npm --name "momentum-emr" -i max -- start
pm2 save
```

### Enable Nginx Caching
```bash
sudo nano /etc/nginx/sites-available/momentum-emr
```

Add inside server block:
```nginx
# Cache static assets
location /_next/static {
    alias /root/EMR/apps/web/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}

location /static {
    alias /root/EMR/apps/web/public;
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

### PostgreSQL Tuning
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Update these values based on your server RAM:
```conf
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 50-75% of RAM
maintenance_work_mem = 128MB
work_mem = 16MB
```

```bash
sudo systemctl restart postgresql
```

---

## Monitoring

### Set Up Basic Monitoring
```bash
# Install htop for server monitoring
sudo apt install htop -y

# Monitor in real-time
htop

# PM2 monitoring
pm2 monit

# Nginx status
sudo systemctl status nginx
```

### Monitor Disk Space
```bash
# Check disk usage
df -h

# Check directory sizes
du -sh /root/*

# Clean up old logs
pm2 flush
sudo journalctl --vacuum-time=7d
```

---

## Quick Start Checklist

1. ✅ Install PostgreSQL, Nginx, PM2
2. ✅ Create database and user
3. ✅ Configure .env.production
4. ✅ Install dependencies: `pnpm install`
5. ✅ Generate Prisma client: `cd packages/database && pnpm generate`
6. ✅ Run migrations: `pnpm prisma db push`
7. ✅ Build application: `pnpm build`
8. ✅ Start with PM2: `pm2 start npm --name "momentum-emr" -- start`
9. ✅ Configure Nginx reverse proxy
10. ✅ Set up firewall: `sudo ufw enable`
11. ✅ Install SSL certificate (optional)
12. ✅ Create admin user
13. ✅ Test deployment
14. ✅ Set up backups

---

## Support

If you encounter issues:
1. Check logs: `pm2 logs momentum-emr`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify database connection: `psql -U momentum_user -d momentum_emr`
4. Restart services: `pm2 restart all && sudo systemctl restart nginx`

---

**Deployment completed!** Access your application at https://yourdomain.com 🎉
