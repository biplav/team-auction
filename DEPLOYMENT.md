# Deployment Guide

This guide covers multiple deployment options for the Cricket Auction Platform.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Vercel Deployment](#vercel-deployment)
- [VPS/Cloud Deployment](#vpscloud-deployment)
- [Post-Deployment Steps](#post-deployment-steps)

## Prerequisites

Before deploying, ensure you have:
- CockroachDB or PostgreSQL database (production instance)
- Node.js 18+ installed (for local testing)
- Docker installed (for Docker deployment)
- Git repository set up on GitHub

## Environment Setup

### 1. Database Setup

Create a production CockroachDB database:
1. Sign up at https://cockroachlabs.cloud/
2. Create a new cluster
3. Create a database named `cric_auction`
4. Get your connection string

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database URL from CockroachDB
DATABASE_URL="postgresql://user:password@host:26257/cric_auction?sslmode=require"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-production-secret-here"

# Your production domain
NEXTAUTH_URL="https://yourdomain.com"
```

### 3. Initialize Database

Run Prisma migrations:
```bash
npx prisma generate
npx prisma db push
```

Seed admin user:
```bash
npx tsx prisma/seed.ts
```

## Docker Deployment

### Build and Run Locally

1. Build the Docker image:
```bash
docker build -t cricket-auction .
```

2. Run the container:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  cricket-auction
```

### Deploy to Cloud Platforms

#### Railway

1. Push code to GitHub
2. Go to https://railway.app/
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables in Railway dashboard
6. Railway will auto-detect Dockerfile and deploy

#### Render

1. Push code to GitHub
2. Go to https://render.com/
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Environment: Docker
   - Build Command: (auto-detected)
   - Start Command: (auto-detected)
6. Add environment variables
7. Deploy

#### Digital Ocean App Platform

1. Push code to GitHub
2. Go to DigitalOcean App Platform
3. Create new app from GitHub repository
4. DigitalOcean will detect Dockerfile
5. Configure environment variables
6. Deploy

### Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=\${NEXTAUTH_URL}
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Vercel Deployment

**Note**: Vercel doesn't support WebSocket connections for Socket.IO. You'll need a separate Socket.IO server.

### Deploy Main App to Vercel

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
4. Deploy

### Socket.IO Server (Separate)

Deploy Socket.IO server to Railway/Render:

1. Extract Socket.IO logic to separate service
2. Deploy to Railway or Render
3. Update Socket.IO client URL in your code

Alternatively, use Vercel with polling fallback (less efficient but works).

## VPS/Cloud Deployment

### AWS EC2, DigitalOcean Droplet, etc.

1. **Server Setup**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

2. **Deploy Application**:
```bash
# Clone repository
git clone <your-repo-url>
cd cricket-auction

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
nano .env  # Edit with production values

# Build application
npm run build

# Start with PM2
pm2 start npm --name cricket-auction -- start
pm2 save
pm2 startup
```

3. **Set Up Nginx (Reverse Proxy)**:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.IO support
    location /api/socket/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

4. **Set Up SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment Steps

### 1. Verify Services

- [ ] Application loads correctly
- [ ] Database connection works
- [ ] Can sign in as admin
- [ ] Socket.IO real-time updates work
- [ ] File uploads work (CSV/Excel)

### 2. Create Admin User

If using `/api/setup-admin`:
```bash
curl -X POST https://yourdomain.com/api/setup-admin
```

Default credentials:
- Email: `admin@cricauction.com`
- Password: `admin123`

**IMPORTANT**: Change these immediately!

### 3. Security Checklist

- [ ] Changed default admin password
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Strong `NEXTAUTH_SECRET` configured
- [ ] Database credentials secured
- [ ] Firewall configured properly
- [ ] Regular backups scheduled

### 4. Test Critical Flows

1. Create auction
2. Add teams with budgets
3. Upload players via CSV
4. Conduct live auction
5. Place bids as team owner
6. Verify public display screen
7. Check analytics dashboard

### 5. Monitoring Setup

Consider setting up:
- **Error Tracking**: Sentry, LogRocket
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance Monitoring**: New Relic, DataDog
- **Log Management**: Logtail, Papertrail

### 6. Backup Strategy

Set up automated backups for:
- Database (CockroachDB has built-in backups)
- Environment configuration
- Uploaded files (if storing locally)

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check firewall allows database access
- Ensure SSL mode is set correctly
- Test connection: `npx prisma db push`

### Socket.IO Not Working

- Check if WebSockets are supported on platform
- Verify Socket.IO endpoint is accessible
- Check browser console for connection errors
- Enable polling fallback if needed

### File Upload Errors

- Verify `bodySizeLimit` in `next.config.ts`
- Check server has sufficient storage
- Ensure proper permissions on upload directory

## Performance Optimization

### 1. Database Indexing

Already configured in Prisma schema:
- Player name, status
- Team names
- Bid timestamps

### 2. Caching Strategy

Consider adding:
- Redis for session caching
- CDN for static assets
- API response caching

### 3. Horizontal Scaling

For high-traffic auctions:
- Use load balancer (AWS ALB, Nginx)
- Deploy multiple app instances
- Centralized session storage (Redis)
- Sticky sessions for Socket.IO

## Maintenance

### Regular Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart application
pm2 restart cricket-auction
```

### Database Migrations

```bash
# After schema changes
npx prisma generate
npx prisma db push

# Or use migrations for production
npx prisma migrate deploy
```

## Cost Estimates

### Minimum Setup (Small Auctions)
- **Database**: CockroachDB Serverless (Free tier available)
- **Hosting**: Railway/Render ($5-10/month)
- **Total**: ~$5-10/month

### Medium Setup (Regular Use)
- **Database**: CockroachDB Standard ($29/month)
- **Hosting**: DigitalOcean Droplet ($12/month)
- **Domain**: $10/year
- **Total**: ~$41/month

### Large Setup (High Traffic)
- **Database**: CockroachDB Dedicated ($295+/month)
- **Hosting**: AWS EC2 Multiple instances ($50+/month)
- **CDN**: Cloudflare Pro ($20/month)
- **Total**: ~$365+/month

## Support

For deployment issues:
1. Check this deployment guide
2. Review application logs
3. Check platform-specific documentation
4. Create an issue on GitHub

---

Built with Next.js, TypeScript, Prisma, and Socket.IO
