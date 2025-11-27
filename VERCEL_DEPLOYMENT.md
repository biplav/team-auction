# Vercel Deployment Guide

Complete guide to deploy your Cricket Auction Platform to Vercel.

## Important: Socket.IO Limitations on Vercel

⚠️ **Vercel Serverless Functions don't support persistent WebSocket connections.**

Your options:
1. **Use polling fallback** (Socket.IO will automatically fall back to HTTP polling)
2. **Deploy Socket.IO separately** (recommended for production)

For now, we'll use **polling fallback** which works but is less efficient than WebSockets.

## Step-by-Step Deployment

### 1. Prerequisites

Before deploying:
- ✅ Code pushed to GitHub (https://github.com/biplav/team-auction)
- ✅ CockroachDB database created and accessible
- ✅ Database has been initialized with Prisma

### 2. Create Vercel Account

1. Go to https://vercel.com
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub account

### 3. Import Your Project

1. After signing in, click **Add New** → **Project**
2. You'll see your GitHub repositories
3. Find and click **Import** next to `biplav/team-auction`
4. Vercel will analyze your project

### 4. Configure Project Settings

#### Framework Preset
- Vercel should auto-detect: **Next.js**
- If not, select it manually

#### Root Directory
- Leave as: `.` (root)

#### Build and Output Settings
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 5. Configure Environment Variables

This is the most important step!

Click **Environment Variables** section and add these:

#### Required Variables:

**DATABASE_URL**
```
postgresql://username:password@host:26257/cric_auction?sslmode=require
```
- Get this from your CockroachDB dashboard
- Click the 🔒 icon to mark as secret
- Select: Production, Preview, and Development

**NEXTAUTH_SECRET**
```
your-secret-key-here
```
- Generate with: `openssl rand -base64 32`
- Must be at least 32 characters
- Click the 🔒 icon to mark as secret
- Select: Production, Preview, and Development

**NEXTAUTH_URL**
```
https://your-app-name.vercel.app
```
- Vercel will give you this URL after deployment
- For now, use a placeholder: `https://team-auction.vercel.app`
- You can update it after first deployment

### 6. Deploy

1. Review your settings
2. Click **Deploy**
3. Vercel will:
   - Install dependencies (~2 minutes)
   - Generate Prisma Client
   - Build Next.js application (~2 minutes)
   - Deploy to CDN

**Total deployment time**: ~5-10 minutes

### 7. After First Deployment

#### Update NEXTAUTH_URL

1. Copy your deployment URL (e.g., `https://team-auction.vercel.app`)
2. Go to **Settings** → **Environment Variables**
3. Click on **NEXTAUTH_URL**
4. Update to your actual URL
5. Click **Save**
6. Redeploy: **Deployments** → Latest deployment → **⋯** menu → **Redeploy**

#### Initialize Database

Your database should already be initialized from local development, but verify:

```bash
# Run locally or use Vercel CLI
npx prisma db push
npx tsx prisma/seed.ts
```

### 8. Test Your Deployment

Visit your Vercel URL and test:

1. **Homepage loads**: `https://your-app.vercel.app`
2. **Admin login**:
   - Go to `/auth/signin`
   - Email: `admin@cricauction.com`
   - Password: `admin123`
   - **IMPORTANT**: Change password immediately!

3. **Create auction**:
   - Create new auction
   - Add teams
   - Upload players (CSV)

4. **Test real-time features**:
   - Start auction
   - Open bidding page
   - Place bids
   - Verify updates work (will use polling instead of WebSockets)

## Vercel Configuration Files

### vercel.json (Optional)

Create this file if you need custom configuration:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url"
  }
}
```

## Performance Optimization for Vercel

### 1. Enable Edge Functions (Optional)

For better global performance, you can use Edge Runtime for some routes.

Add to specific route files:
```typescript
export const runtime = 'edge';
```

### 2. Configure Caching

Vercel automatically caches static assets. For API routes with stable data:

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

## Socket.IO on Vercel

### Current Setup (Polling Fallback)

Your Socket.IO will automatically fall back to HTTP polling on Vercel:
- ✅ Works out of the box
- ✅ No code changes needed
- ⚠️ Less efficient than WebSockets
- ⚠️ Higher bandwidth usage
- ⚠️ Slightly higher latency

### Production Solution (External Socket.IO Server)

For better performance in production:

#### Option A: Railway (Recommended)

1. Create a separate Socket.IO server project
2. Deploy to Railway
3. Update your app to connect to Railway Socket.IO endpoint

#### Option B: Use Vercel + Pusher/Ably

Replace Socket.IO with a managed service:
1. Sign up for Pusher (https://pusher.com) or Ably (https://ably.com)
2. Replace Socket.IO implementation
3. Both have free tiers

## Custom Domain Setup

### 1. Add Domain to Vercel

1. Go to **Settings** → **Domains**
2. Click **Add**
3. Enter your domain (e.g., `auction.yourdomain.com`)
4. Vercel will provide DNS records

### 2. Configure DNS

Add these records to your domain provider:

**CNAME Record**:
```
Name: auction (or @)
Value: cname.vercel-dns.com
```

### 3. Update NEXTAUTH_URL

1. Go to **Settings** → **Environment Variables**
2. Update `NEXTAUTH_URL` to your custom domain
3. Redeploy

### 4. SSL Certificate

Vercel automatically provisions SSL certificates (Let's Encrypt).

## Monitoring and Logs

### View Deployment Logs

1. Go to **Deployments**
2. Click on a deployment
3. View build logs and runtime logs

### Real-time Logs

Install Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel logs
```

### Analytics

Vercel provides built-in analytics:
1. Go to **Analytics** tab
2. View:
   - Page views
   - Top pages
   - Visitor insights
   - Performance metrics

## Troubleshooting

### Build Fails

**Error**: Prisma generation fails
```bash
# Solution: Ensure prisma is in dependencies, not devDependencies
npm install @prisma/client
```

**Error**: Out of memory
```bash
# Add to package.json scripts:
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

### Runtime Errors

**Error**: Database connection fails
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Check CockroachDB is running

**Error**: NextAuth errors
- Verify `NEXTAUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` matches your deployment URL
- Check environment variables are in Production scope

### Socket.IO Not Working

**Issue**: Real-time updates delayed
- Expected with polling fallback
- Updates will work but with ~2-3 second delay
- Consider external Socket.IO server for production

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "feat: add new feature"
git push

# Vercel automatically:
# 1. Detects push
# 2. Builds new version
# 3. Deploys to production
# 4. Updates your domain
```

### Preview Deployments

Every pull request gets a preview deployment:
1. Create a branch: `git checkout -b feature/new-feature`
2. Make changes and push
3. Create pull request on GitHub
4. Vercel creates preview URL
5. Test before merging

## Environment-Specific Settings

### Production
- Stable URL
- Production database
- Cached builds
- Analytics enabled

### Preview
- Unique URL per PR
- Can use preview database
- Helps test before production

### Development
- Local development
- Use `.env.local`
- Hot reload enabled

## Cost and Limits

### Hobby Plan (Free)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless function executions
- ✅ SSL certificates
- ⚠️ Commercial use not allowed

### Pro Plan ($20/month)
- ✅ Commercial use allowed
- ✅ 1TB bandwidth
- ✅ Advanced analytics
- ✅ Team collaboration
- ✅ Password protection

## Production Checklist

Before going live:

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Production database connected
- [ ] All environment variables set
- [ ] Default admin password changed
- [ ] Analytics enabled
- [ ] Error monitoring set up (Sentry)
- [ ] Tested all core features
- [ ] Backup strategy in place
- [ ] Socket.IO performance acceptable

## Next Steps After Deployment

1. **Change Default Credentials**:
   ```
   Email: admin@cricauction.com
   Password: admin123
   ```
   Change these immediately!

2. **Create Your First Auction**:
   - Sign in as admin
   - Create auction
   - Add teams
   - Upload players

3. **Test Real-time Features**:
   - Start auction
   - Place bids from different devices
   - Verify updates work

4. **Monitor Performance**:
   - Check Vercel Analytics
   - Monitor error rates
   - Watch function execution times

5. **Set Up Monitoring** (Optional):
   - Sentry for error tracking
   - LogRocket for session replay
   - UptimeRobot for uptime monitoring

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/next.js/discussions

---

Your cricket auction platform is now live on Vercel! 🎉
