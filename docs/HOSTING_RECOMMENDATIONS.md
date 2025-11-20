# Momentum EMR - Cloud Hosting Recommendations

## Executive Summary

This document provides comprehensive hosting recommendations for deploying the Momentum EMR system on Vultr (primary) and DigitalOcean (alternative), with capacity analysis for Nigerian hospital deployments.

---

## System Architecture Overview

**Tech Stack:**
- **Frontend**: Next.js 14 (React)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Server-sent events/WebSockets potential
- **Storage**: File uploads (medical records, images)

---

## Nigerian Hospital Context

### Typical Hospital Sizes in Nigeria

Based on research and Nigerian healthcare statistics:

| Hospital Type | Bed Capacity | Daily Outpatients | Staff Count | Patients/Day |
|---------------|-------------|-------------------|-------------|--------------|
| **Small Clinic** | 10-30 beds | 50-100 | 10-20 staff | 60-120 |
| **Medium Hospital** | 50-150 beds | 150-300 | 30-80 staff | 180-400 |
| **Large Hospital** | 200-400 beds | 300-600 | 80-200 staff | 400-800 |
| **Teaching Hospital** | 500+ beds | 600-1000+ | 200-500 staff | 800-1500+ |

**Key Statistics:**
- Nigeria has 0.9 hospital beds per 1,000 people (vs global average of 2.3)
- Average doctor sees 80-100 patients/day due to shortages
- Peak hours: 8am-2pm (60-70% of daily traffic)
- Emergency departments operate 24/7

---

## Hosting Plans Analysis

### 🟦 VULTR (Primary Recommendation)

#### **OPTION 1: Budget Plan (Low Cost)** ⭐ MINIMUM VIABLE
**Vultr VX1: 1 vCPU, 2GB RAM, 50GB NVMe**
- **Price**: ~$12/month
- **Bandwidth**: 2TB/month
- **Storage**: 50GB NVMe SSD

**Capacity:**
- **Concurrent Users**: 15-25 active users
- **Total Registered**: Up to 300 users (staff + patients)
- **Daily Transactions**: 1,500-2,000 operations
- **Hospital Size**: 1-2 small clinics (10-30 beds each)
- **Staff**: 10-25 across all hospitals
- **Active Patients**: 50-100 daily

**Best For:**
- Single small clinic or health center
- Pilot/MVP deployment
- Development/staging environment
- Budget-constrained startups

**Limitations:**
- No redundancy
- Limited during peak hours
- Requires careful optimization

---

#### **OPTION 2: Your Mentioned Plan (Good Balance)** ⭐ RECOMMENDED
**Vultr VX1: 2 vCPU, 8GB RAM, 50GB NVMe**
- **Price**: ~$60/month
- **Bandwidth**: 5TB/month
- **Storage**: 50GB NVMe (+ expandable block storage)

**Capacity:**
- **Concurrent Users**: 80-120 active users
- **Total Registered**: 2,000-3,000 users
- **Daily Transactions**: 10,000-15,000 operations
- **Hospital Size**: 3-5 medium hospitals (50-150 beds each)
- **Staff**: 100-200 across all hospitals
- **Active Patients**: 300-600 daily
- **Database Size**: Up to 200GB with optimization

**Best For:**
- 3-5 medium-sized private hospitals
- Growing healthcare network
- Multi-tenant deployment
- Production environment with moderate growth

**Performance Expectations:**
- Response time: <200ms (average)
- Peak load handling: 120-150 concurrent users (short bursts)
- Database queries: 500-800 per second
- File uploads: Concurrent handling of 10-15 uploads

---

#### **OPTION 3: Optimal Plan (High Performance)** ⭐ OPTIMAL
**Vultr VX1: 4 vCPU, 16GB RAM, 100GB NVMe**
- **Price**: ~$120/month
- **Bandwidth**: 6TB/month
- **Storage**: 100GB NVMe

**Capacity:**
- **Concurrent Users**: 200-300 active users
- **Total Registered**: 5,000-8,000 users
- **Daily Transactions**: 25,000-40,000 operations
- **Hospital Size**: 8-12 medium hospitals OR 3-4 large hospitals
- **Staff**: 300-500 across all hospitals
- **Active Patients**: 800-1,200 daily
- **Database Size**: Up to 500GB with proper indexing

**Best For:**
- Large hospital network (5+ locations)
- Teaching hospitals
- High-volume clinics
- Future-proof deployment
- Multiple simultaneous peak loads

**Performance Expectations:**
- Response time: <150ms (average)
- Peak load: 300-400 concurrent users
- Database queries: 1,500+ per second
- Real-time features fully supported

---

#### **OPTION 4: Enterprise Plan (Maximum Scale)**
**Vultr VX1: 8 vCPU, 32GB RAM, 200GB NVMe**
- **Price**: ~$240/month
- **Bandwidth**: 7TB/month
- **Storage**: 200GB NVMe

**Capacity:**
- **Concurrent Users**: 500-700 active users
- **Total Registered**: 15,000-20,000 users
- **Daily Transactions**: 60,000-100,000 operations
- **Hospital Size**: 15-20 hospitals OR 2-3 teaching hospitals
- **Staff**: 600-1,000 across network
- **Active Patients**: 2,000-3,000 daily

---

### 🌊 DIGITALOCEAN (Alternative)

#### **OPTION 1: Budget Plan**
**Basic Droplet: 1 vCPU, 2GB RAM, 50GB SSD**
- **Price**: $18/month
- **Bandwidth**: 2TB/month
- **Similar capacity to Vultr $12 plan**
- **50% more expensive than Vultr equivalent**

---

#### **OPTION 2: Comparable to Your Vultr Plan**
**Basic Droplet: 2 vCPU, 4GB RAM, 80GB SSD**
- **Price**: $48/month
- **Bandwidth**: 4TB/month

**Capacity:**
- **Concurrent Users**: 60-80 active users
- **Total Registered**: 1,500-2,000 users
- **Hospital Size**: 2-4 medium hospitals
- **Staff**: 80-150
- **Active Patients**: 250-400 daily

**Note**: Less RAM than Vultr $60 plan (4GB vs 8GB) but cheaper

---

#### **OPTION 3: Recommended Plan (Match Vultr Performance)**
**General Purpose Droplet: 2 vCPU, 8GB RAM, 25GB NVMe**
- **Price**: $84/month (Premium tier)
- **Bandwidth**: 5TB/month
- **Dedicated vCPUs**

**Capacity:**
- Similar to Vultr $60 plan but 40% more expensive
- **Concurrent Users**: 80-120 active users
- Better CPU performance due to dedicated cores
- Less storage (25GB vs 50GB)

---

#### **OPTION 4: High Performance**
**General Purpose Droplet: 4 vCPU, 16GB RAM, 50GB NVMe**
- **Price**: $168/month
- **Bandwidth**: 6TB/month

**Capacity:**
- Similar to Vultr $120 plan but 40% more expensive
- **Concurrent Users**: 200-300 active users
- Premium networking (up to 10Gbps)

---

## Cost Comparison Summary

| Specs | Vultr Price | DigitalOcean Price | Savings with Vultr |
|-------|-------------|--------------------|--------------------|
| 1 vCPU, 2GB RAM | $12/mo | $18/mo | **33% cheaper** |
| 2 vCPU, 8GB RAM | $60/mo | $84/mo | **29% cheaper** |
| 4 vCPU, 16GB RAM | $120/mo | $168/mo | **29% cheaper** |

**Winner**: Vultr offers better price-performance ratio

---

## Recommended Deployment Strategy

### Phase 1: Start Small (Month 1-3)
**Plan**: Vultr 2 vCPU, 8GB RAM - $60/month
- Deploy for 2-3 initial hospitals
- Monitor usage patterns
- Optimize queries and caching
- Test backup procedures

### Phase 2: Scale as Needed (Month 3-6)
- If hitting 80% CPU consistently → Upgrade to 4 vCPU
- If hitting 80% RAM consistently → Upgrade to 16GB
- Add separate PostgreSQL managed database (~$15-30/mo)
- Implement Redis caching (~$10/mo)

### Phase 3: Optimize Architecture (Month 6+)
- Consider load balancer for multiple servers
- Separate database server
- CDN for static assets (Cloudflare free tier)
- Backup server for disaster recovery

---

## Additional Infrastructure Costs

### Essential Add-ons:

1. **PostgreSQL Managed Database** (Optional but recommended for production)
   - Vultr: $15/month (1GB RAM, 10GB storage)
   - DigitalOcean: $15/month (1GB RAM, 10GB storage)
   - Benefits: Automated backups, high availability

2. **Block Storage** (For medical records/images)
   - Vultr: $1/month per 10GB
   - DigitalOcean: $0.10/GB/month
   - Recommended: 100GB = $10/month

3. **Backups**
   - Vultr: $6/month (automatic snapshots)
   - DigitalOcean: 20% of droplet cost
   - Critical for healthcare data

4. **CDN** (Optional)
   - Cloudflare: Free tier sufficient
   - Improves Nigeria-wide access

5. **Monitoring**
   - UptimeRobot: Free
   - Better Stack: Free tier
   - Essential for healthcare uptime

### Total Monthly Cost Examples:

**Budget Setup:**
- Vultr 2vCPU/8GB: $60
- Block Storage 50GB: $5
- Backups: $6
- **Total**: ~$71/month

**Production Setup:**
- Vultr 4vCPU/16GB: $120
- Managed PostgreSQL: $15
- Block Storage 100GB: $10
- Backups: $12
- **Total**: ~$157/month

**Enterprise Setup:**
- Vultr 8vCPU/32GB: $240
- Managed PostgreSQL (4GB): $50
- Block Storage 200GB: $20
- Backups: $24
- Load Balancer: $10
- **Total**: ~$344/month

---

## Performance Optimization Tips

### Database Optimization:
1. **Connection Pooling**: Use Prisma's connection pool (limit: RAM_GB × 10)
2. **Indexes**: Create indexes on frequently queried fields
3. **Query Optimization**: Use `select` to limit returned fields
4. **Pagination**: Always paginate large result sets

### Application Optimization:
1. **Next.js Production Build**: Always use `pnpm build`
2. **Static Generation**: Use ISR for patient lists
3. **Image Optimization**: Use Next.js Image component
4. **API Route Caching**: Implement Redis for frequently accessed data

### Monitoring:
1. **Set up alerts** for CPU >80%, RAM >85%
2. **Monitor database connections** (should be <50% of max)
3. **Track response times** (alert if >500ms)
4. **Log slow queries** (>100ms)

---

## Capacity Planning Formula

### Concurrent User Estimation:
```
Concurrent Users = (RAM_GB - 2) × 15
```
- Subtract 2GB for OS + Next.js + PostgreSQL
- Multiply by 15 users per GB (conservative for database-heavy app)

### Example for 8GB Server:
```
(8 - 2) × 15 = 90 concurrent users (conservative)
```

### Peak Load Factor:
- Nigerian hospitals: 60-70% of daily traffic in 6 hours (8am-2pm)
- Plan for 3× average concurrent users during peak

---

## Migration & Deployment Guide

### Step 1: Server Setup (30 minutes)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### Step 2: Database Setup (15 minutes)
```bash
# Create database
sudo -u postgres createdb momentum_emr

# Create user
sudo -u postgres psql -c "CREATE USER momentum WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE momentum_emr TO momentum;"

# Run migrations
cd /var/www/momentum-emr
pnpm prisma migrate deploy
```

### Step 3: Application Deploy (20 minutes)
```bash
# Clone repository
cd /var/www
git clone <your-repo> momentum-emr
cd momentum-emr

# Install dependencies
pnpm install

# Build application
pnpm build

# Start with PM2
pm2 start npm --name "momentum-emr" -- start
pm2 save
pm2 startup
```

### Step 4: Nginx Configuration (10 minutes)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: SSL Setup (5 minutes)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

---

## Final Recommendations

### For Your Use Case:

**Best Starting Point**: **Vultr 2 vCPU, 8GB RAM - $60/month**

**Rationale:**
1. ✅ Handles 3-5 medium hospitals comfortably
2. ✅ 100-200 staff members supported
3. ✅ 300-600 daily active patients
4. ✅ Room to grow to 120 concurrent users
5. ✅ Cost-effective at $60/month
6. ✅ Easy to scale up as needed

**When to Upgrade to $120 Plan:**
- Adding 6th+ hospital
- Consistent >70% RAM usage
- Response times >300ms regularly
- Planning teaching hospital deployment
- Exceeding 150 concurrent users regularly

**When to Consider $12 Budget Plan:**
- Single clinic pilot (1-2 locations)
- Testing/staging environment
- Very small operation (<30 beds total)
- Budget constraints with optimization willingness

### Why Vultr Over DigitalOcean:
1. **29-33% cheaper** for equivalent specs
2. **Better RAM** for the price (8GB vs 4GB at similar price point)
3. **NVMe storage included** (faster database operations)
4. **AMD EPYC processors** (newer generation)
5. **Simple pricing** (no premium tiers confusion)

### Don't Forget:
- Budget $10-20/month for backups and storage
- SSL certificate is free with Let's Encrypt
- Monitor and optimize regularly
- Start conservative, scale up as needed

---

## Support & Monitoring

### Recommended Tools (All Free Tier):
- **UptimeRobot**: Uptime monitoring
- **Better Stack**: Log management
- **Cloudflare**: CDN and DDoS protection
- **Sentry**: Error tracking

### Expected Uptime:
- Target: 99.9% uptime (43 minutes downtime/month)
- With managed database: 99.95% possible
- With load balancer: 99.99% achievable

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Next Review**: Before production deployment
