# Deployment Guide - Odisha Pizza Hub

## Overview
This guide covers deploying the full-stack Odisha Pizza Hub system to production.

**Architecture:**
- Frontend: Vercel (React + Vite)
- Backend: Railway/Render (Node.js + Express)
- Database: MongoDB Atlas
- Cache: Redis Cloud
- Payment: Razorpay

---

## Prerequisites
- Git repository on GitHub
- Credit cards for paid services
- Domain name (optional but recommended)

---

## Part 1: Database Setup (MongoDB Atlas)

### 1.1 Create MongoDB Atlas Account
1. Go to [mongodb.com/cloud](https://mongodb.com/cloud)
2. Sign up with email or Google
3. Create organization and project

### 1.2 Create Cluster
1. Click "Create" to create new cluster
2. Choose **M0** (free tier) for development
3. Select region close to your users
4. Wait for cluster creation (5-10 minutes)

### 1.3 Create Database User
1. Go to **Database Access** → **Add New Database User**
2. Create username and strong password
3. Set role as **Read and write to any database**
4. Note down credentials

### 1.4 Configure Network Access
1. Go to **Network Access** → **Add IP Address**
2. For development: Add `0.0.0.0/0` (anywhere)
3. For production: Add specific IPs of deployment platforms

### 1.5 Get Connection String
1. Go to **Clusters** → **Connect**
2. Choose **Connect your application**
3. Select **Node.js** driver
4. Copy connection string
5. Replace `<username>` and `<password>` with credentials
6. Replace `<database>` with your database name

**Format:** 
```
mongodb+srv://username:password@cluster.mongodb.net/odisha-pizza?retryWrites=true&w=majority
```

---

## Part 2: Redis Cloud Setup

### 2.1 Create Redis Cloud Account
1. Go to [redis.com/cloud](https://redis.com/cloud)
2. Sign up and create account
3. Complete onboarding

### 2.2 Create Database
1. Click **Create** → **New database**
2. Choose **Free** tier
3. Select region
4. Click **Create**

### 2.3 Get Connection URL
1. Go to Databases → Your database
2. Click **Copy Redis URL** button
3. URL format: `redis://:password@host:port`

---

## Part 3: Backend Deployment (Railway)

### 3.1 Connect GitHub Repository
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect GitHub account
4. Click **New Project** → **Deploy from GitHub repo**
5. Select your repository

### 3.2 Configure Backend Service
1. Select **Backend** folder as root
2. Railway auto-detects it's a Node.js app
3. No manual configuration needed

### 3.3 Add Environment Variables
1. Go to **Variables** tab
2. Add from `backend/.env.example`:

```
NODE_ENV=production
PORT=3000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/odisha-pizza

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://:password@host:port

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Razorpay (get from Razorpay dashboard)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Notification Services
EMAIL_PROVIDER=mock
SMS_PROVIDER=mock
WHATSAPP_PROVIDER=mock
```

### 3.4 Add Custom Domain (Optional)
1. Go to **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS records as per Railway instructions

### 3.5 Get Deployment URL
After deployment, Railway provides URL like: `https://projectname-production.up.railway.app`

---

## Part 4: Frontend Deployment (Vercel)

### 4.1 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **Import Project**
4. Select your repository
5. Vercel auto-detects Next.js/Vite setup

### 4.2 Configure Frontend
1. **Project Settings**:
   - Framework: Vite
   - Root Directory: ./frontend
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-domain/api
   VITE_SOCKET_URL=https://your-backend-domain
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
   ```

### 4.3 Deploy
1. Click **Deploy**
2. Wait for build and deployment (2-5 minutes)
3. Vercel provides URL automatically

### 4.4 Add Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Add your domain
3. Update DNS records

---

## Part 5: Razorpay Integration

### 5.1 Create Razorpay Account
1. Go to [razorpay.com](https://razorpay.com)
2. Sign up and verify email
3. Complete KYC (Know Your Customer)

### 5.2 Get API Keys
1. Go to **Settings** → **API Keys**
2. Copy **Key ID** and **Key Secret**
3. Use for production environment

### 5.3 Setup Webhook
1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-backend-domain/api/payments/razorpay/webhook`
3. Select events:
   - `payment.captured`
   - `payment.failed`
4. Copy webhook secret and use as `RAZORPAY_WEBHOOK_SECRET`

### 5.4 Enable Payment Modes
1. Go to **Settings** → **Payment Methods**
2. Enable:
   - Credit/Debit Cards
   - Net Banking
   - Digital Wallets
   - UPI

---

## Part 6: Post-Deployment Configuration

### 6.1 Update CORS Settings
In `backend/src/app.js`, update CORS to include production frontend URL:

```javascript
app.use(cors({ 
  origin: [
    "http://localhost:5173", // Development
    "https://your-frontend-domain.vercel.app" // Production
  ],
  credentials: true 
}));
```

### 6.2 Seed Production Database
Run seed script after backend deployment:
```bash
npm run seed
```

This creates:
- Admin user: `admin@odishapizza.com` / `admin123`
- Sample products
- Sample coupons and offers

### 6.3 Test Payment Gateway
1. Use Razorpay test mode cards:
   - Card: 4111111111111111
   - Expiry: Any future date
   - CVV: Any 3 digits

### 6.4 Initialize Admin Dashboard
1. Access frontend and login as admin
2. Create additional products
3. Test order management

---

## Part 7: Monitoring & Maintenance

### 7.1 Monitor Backend
- Railway Dashboard for logs and metrics
- Check MongoDB Atlas metrics
- Monitor Redis usage

### 7.2 Monitor Frontend
- Vercel Analytics for performance
- Check build logs
- Monitor Core Web Vitals

### 7.3 Database Backups
- MongoDB Atlas: Enable automated snapshots
- Redis: Use manual backups monthly

### 7.4 Logging
Add logging middleware to capture errors:
```javascript
import morgan from "morgan";
app.use(morgan("combined")); // Logs all requests
```

---

## Part 8: SSL/TLS & Security

### 8.1 SSL Certificate
- Vercel: Automatic HTTPS
- Railway: Automatic HTTPS
- Get A grade on SSL Labs

### 8.2 Security Headers
Update `backend/src/app.js`:
```javascript
app.use(helmet()); // Already included
```

### 8.3 Rate Limiting
Add to block brute force attacks:
```javascript
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

---

## Part 9: Performance Optimization

### 9.1 Frontend
- Enable gzip compression
- Lazy load images
- Code splitting with React.lazy()
- Cache static assets

### 9.2 Backend
- Enable Redis caching
- Add database indexes
- Optimize queries
- Use connection pooling

### 9.3 Database
In MongoDB Atlas, add indexes:
```javascript
// backend/src/models/Product.js
productSchema.index({ category: 1, type: 1 });
productSchema.index({ isAvailable: 1 });

// backend/src/models/Order.js
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
```

---

## Part 10: Scaling for Production

### 10.1 Database Scaling
- Upgrade MongoDB tier as usage grows
- Use read replicas for reporting
- Archive old orders annually

### 10.2 Backend Scaling
- Add more Railway dynos
- Use load balancer
- Scale Redis cluster

### 10.3 Frontend Scaling
- Use Vercel edge functions
- Enable ISR (Incremental Static Regeneration)
- Use CDN for assets

---

## Troubleshooting

### Backend won't start
1. Check `NODE_ENV=production`
2. Verify all env variables are set
3. Check MongoDB connection
4. Check Redis connection
5. View logs in Railway dashboard

### Frontend shows API errors
1. Verify `VITE_API_URL` is correct
2. Check CORS settings on backend
3. Verify API is running
4. Check network tab in DevTools

### Payment webhook failing
1. Verify webhook URL is public
2. Check webhook secret matches
3. Verify payment events are enabled
4. Test with Razorpay webhook tester

### Database connection timeout
1. Check IP whitelist in MongoDB Atlas
2. Verify connection string
3. Check network on deployment platform
4. Restart MongoDB cluster if needed

---

## Useful Commands

```bash
# Build frontend
npm run build:frontend

# Start backend locally
npm run dev:backend

# Seed database
npm run seed

# Check deployment logs
# Railway: Click on your service → View logs
# Vercel: Click on your project → Deployments → View logs
```

---

## Cost Estimation (Monthly)
- MongoDB Atlas: Free (M0 tier)
- Redis Cloud: Free (30MB)
- Railway: $5-20 (starter plan)
- Vercel: Free (hobby) or $20 (Pro)
- Domain: $10-12/year
- **Total: ~$25-40/month** (development)

---

## Support
- MongoDB: [docs.mongodb.com](https://docs.mongodb.com)
- Railway: [railway.app/docs](https://railway.app/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Razorpay: [razorpay.com/docs](https://razorpay.com/docs)

   - `VITE_SOCKET_URL=https://<backend-domain>`
   - `VITE_RAZORPAY_KEY_ID=<your_razorpay_key_id>`

## 5. CORS
Set backend `FRONTEND_URL` to exact Vercel domain.

## 6. Post Deploy
1. Run seed once against production DB from local machine:
```bash
cd backend
npm install
npm run seed
```
2. Verify:
- `/health`
- auth flow
- menu load
- order placement
- socket live updates (customer + admin)
- Razorpay payment and webhook

## 7. Scaling Notes
- Add Redis persistence or managed high-availability plan.
- Add queue worker for notifications (BullMQ).
- Add rate-limiting and WAF in production.
- Add observability (OpenTelemetry + structured logs).
