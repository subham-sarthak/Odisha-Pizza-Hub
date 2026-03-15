# Testing Guide - Odisha Pizza Hub

Complete testing guide for the Odisha Pizza Hub system.

## Table of Contents
1. [Setup & Configuration](#setup--configuration)
2. [API Testing](#api-testing)
3. [Frontend Testing](#frontend-testing)
4. [Admin Features Testing](#admin-features-testing)
5. [Payment Testing](#payment-testing)
6. [Real-time Features](#real-time-features)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)

---

## Setup & Configuration

### Prerequisites
- NodeJS 18+
- Postman or curl
- MongoDB running locally or Atlas connection
- Redis running locally or Cloud connection

### Local Environment Setup
```bash
# 1. Clone and install
git clone <repo-url>
cd odisha-pizza
npm run install:all

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Configure environment variables
# Edit backend/.env and frontend/.env with your settings

# 4. Seed database
npm run seed

# 5. Start services
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2
```

### Access URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Default Admin: admin@odishapizza.com / admin123

---

## API Testing

### Using cURL

#### Authentication Tests

**Register New User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "testpass123"
  }'
```

**Login with Email**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Send Phone OTP**
```bash
curl -X POST http://localhost:5000/api/auth/phone/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

**Verify Phone OTP**
```bash
curl -X POST http://localhost:5000/api/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "otp": "123456",
    "name": "Test User"
  }'
```

#### Product Tests

**Get All Products**
```bash
curl http://localhost:5000/api/products
```

**Get Products by Category**
```bash
curl "http://localhost:5000/api/products?category=Signature%20Pizzas"
```

**Get Veg Products Only**
```bash
curl "http://localhost:5000/api/products?type=veg"
```

**Search Products**
```bash
curl "http://localhost:5000/api/products?search=Paneer"
```

**Get Categories**
```bash
curl http://localhost:5000/api/products/categories
```

#### Order Tests

**Create Order** (requires authentication)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "productId": "PRODUCT_ID",
        "size": "M",
        "qty": 2,
        "addons": ["Cheese Burst"]
      }
    ],
    "paymentMethod": "cod",
    "pickupTime": "2026-02-14T19:30:00",
    "tableBooking": "T1",
    "couponCode": "ODISHA20",
    "rewardToRedeem": 50
  }'
```

**Get My Orders** (requires authentication)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/orders/mine
```

#### Coupon Tests

**Get Public Coupons**
```bash
curl http://localhost:5000/api/coupons/public
```

**Apply Coupon** (requires authentication)
```bash
curl -X POST http://localhost:5000/api/coupons/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "code": "ODISHA20",
    "amount": 599
  }'
```

#### Offer Tests

**Get Active Offers**
```bash
curl http://localhost:5000/api/offers
```

#### QR Code Tests

**Generate Table QR**
```bash
curl "http://localhost:5000/api/qr/order-link?table=T5"
```

### Using Postman

1. **Create New Collection**: "Odisha Pizza Hub API"
2. **Create Environment** with variables:
   ```
   {{BASE_URL}} = http://localhost:5000/api
   {{TOKEN}} = <your_jwt_token>
   {{PRODUCT_ID}} = <product_id_from_database>
   ```

3. **Create Requests**:
   - Auth: Register, Login, Get Profile
   - Products: List, Filter, Categories
   - Orders: Create, List, Update Status
   - Coupons: List, Apply
   - Offers: List

4. **Run Collection**: Use Postman's Collection Runner

---

## Frontend Testing

### Manual Testing Checklist

#### Authentication Page
- [ ] Register with email/password
- [ ] Login with email/password
- [ ] Register with phone OTP
- [ ] Login with phone OTP
- [ ] Toggle between login modes
- [ ] Validate empty fields
- [ ] Validate email format
- [ ] Validate password strength

#### Menu Page
- [ ] Browse all products
- [ ] Filter by category
- [ ] Filter by veg/non-veg
- [ ] Search by product name
- [ ] View product details
- [ ] See price variations
- [ ] View add-ons

#### Customization Modal
- [ ] Select size (S/M/L/XL)
- [ ] Check price updates with size
- [ ] Add/remove Cheese Burst
- [ ] Increase quantity
- [ ] View total price

#### Cart Page
- [ ] View added items
- [ ] Remove items
- [ ] Update quantity
- [ ] See suggested coupons
- [ ] Apply coupon code
- [ ] See discount applied
- [ ] Redeem reward points
- [ ] Select payment method (COD/Online)
- [ ] Select pickup time
- [ ] Select table number
- [ ] Calculate final total
- [ ] Complete order placement

#### Customer Dashboard
- [ ] View reward points
- [ ] See active orders
- [ ] Track order status
- [ ] View order history
- [ ] See order details (items, amount, pickup time)

#### Admin Dashboard
- [ ] View revenue stats (daily/weekly/monthly)
- [ ] See peak hours heatmap
- [ ] View live orders table
- [ ] Update order status
- [ ] Create new product
- [ ] View product count
- [ ] See user count
- [ ] View coupon count

---

## Admin Features Testing

### Product Management
1. Login as admin
2. Navigate to Admin Dashboard
3. **Create Product**:
   - Enter name, category, type
   - Add sizes with prices
   - Add addons
   - Set stock
   - Add image URL
   - Click Create
4. **Verify**: New product appears in products list

### Coupon Management
1. Login as admin
2. Navigate to create coupon section
3. **Create Coupon**:
   - Code: TESTCPT (auto-uppercase)
   - Discount: 15%
   - Min Order: 300
   - Max Discount: 100
   - Expiry: Future date
4. **Verify**: Coupon appears in customer coupon list

### Offer Management
1. Login as admin
2. **Create Offer**:
   - Title: Test Offer
   - Description: Test offer description
   - Discount: 20%
   - Valid From: Today
   - Valid Till: Future date
3. **Verify**: Offer appears on menu page

### Stock Management
1. Create order with product
2. Check stock reduced on admin dashboard
3. Verify product shows as unavailable when stock = 0

---

## Payment Testing

### Razorpay Test Mode

**Test Card Details:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (MM/YY)
CVV: Any 3 digits
OTP: 123456 (auto-filled in test mode)
```

### Testing Payment Flow
1. Add items to cart
2. Click "Pay & Place Order"
3. Open Razorpay payment modal
4. Use test card above
5. Complete payment
6. Verify order created successfully
7. Check order appears in dashboard

### Cash on Delivery
1. Add items to cart
2. Select "Pay at Counter"
3. Click "Place Order"
4. Verify order is placed
5. Payment status should be "pending"

---

## Real-time Features

### Socket.io Testing

**Customer Testing:**
1. Login as customer
2. Place order
3. Open admin dashboard (another browser/incognito)
4. Login as admin
5. **Verify**: New order appears in live orders
6. Change order status to "preparing"
7. **Verify**: Customer dashboard shows status update in real-time

**Admin Testing:**
1. Open admin dashboard
2. Join admin room automatically
3. Have customer place order
4. **Verify**: See "order:new" event in browser console

### Testing Socket Connection
```javascript
// Run in browser console
io = io('http://localhost:5000');
io.on('connect', () => console.log('Connected'));
io.on('order:update', (order) => console.log('Order update:', order));
io.emit('join:admin'); // For admin
```

---

## Performance Testing

### Load Testing

**Using Apache Bench:**
```bash
# Test API endpoint
ab -n 1000 -c 100 http://localhost:5000/api/products

# Results should show:
# - Response time < 500ms
# - Success rate 100%
```

**Using Artillery:**
```bash
npm install -g artillery

# Create test file
artillery run load-test.yml

# Test concurrent WebSocket connections
```

### Caching Verification

1. **First Request**: Check response time (should hit database)
   ```bash
   curl -w "Time: %{time_total}s" http://localhost:5000/api/products
   ```

2. **Subsequent Requests**: Should be faster (Redis cache)
3. **After Product Change**: Cache should invalidate
4. Check Redis: `redis-cli GET "products:list"`

### Database Queries

**MongoDB Profiling:**
```bash
# Enable database profiling
mongo
> db.setProfilingLevel(1)

# Check slow queries
> db.system.profile.find({millis: {$gt: 100}})
```

---

## Security Testing

### CORS Testing
```bash
# Should work
curl -H "Origin: http://localhost:5173" http://localhost:5000/api/products

# Should fail
curl -H "Origin: http://malicious.com" http://localhost:5000/api/products
```

### Authentication Testing
```bash
# Without token - should fail
curl http://localhost:5000/api/orders

# With invalid token - should fail
curl -H "Authorization: Bearer invalid" http://localhost:5000/api/orders

# With valid token - should work
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/orders
```

### Rate Limiting
```bash
# Should allow 5 auth requests per minute
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -d '{"email":"test@test.com","password":"test"}'
done

# 6th request should fail with rate limit error
```

### Input Validation
```bash
# Missing required fields
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# Invalid email format
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "invalid-email",
    "phone": "9876543210",
    "password": "test123"
  }'
```

### Webhook Security
```bash
# Test webhook signature verification
curl -X POST http://localhost:5000/api/payments/razorpay/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: invalid-signature" \
  -d '{...}'

# Should return 400 with "Invalid webhook signature"
```

---

## Automated Testing (Future)

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## Test Scenarios

### Scenario 1: Complete Order Flow
1. Register as new customer
2. Browse products
3. Add item to cart with customization
4. Apply coupon
5. Redeem reward points
6. Place order with COD
7. Track order status
8. View in order history

### Scenario 2: Admin Operations
1. Login as admin
2. Create new product
3. Create coupon offer
4. Receive new customer order
5. Update order status
6. View analytics
7. Check peak hours

### Scenario 3: Payment Flow
1. Add items to cart
2. Choose online payment
3. Complete Razorpay payment
4. Verify webhook triggers
5. Confirm order placement
6. Check payment status updated

---

## Debugging

### Backend Logs
```bash
# Real-time logs
npm run dev:backend

# Look for: Server running on port 5000
# MongoDB connected
# Redis connected
```

### Frontend Console
```javascript
// Check auth context
console.log(localStorage.getItem('token'));
console.log(localStorage.getItem('user'));

// Check Socket connection
io.engine.on('open', () => console.log('Socket open'));
```

### Database Inspection
```bash
# MongoDB
mongo
> db.products.find()
> db.orders.find()
> db.users.find()

# Redis
redis-cli
> KEYS *
> GET "products:list"
```

---

## Troubleshooting

**Test fails with "Connection refused"**
- Ensure backend is running: `npm run dev:backend`
- Check port 5000 is available
- Verify MongoDB and Redis are running

**CORS errors in frontend**
- Check VITE_API_URL matches backend URL
- Verify FRONTEND_URL in backend .env

**Orders not appearing real-time**
- Check admin has joined admin room
- Verify WebSocket is connected
- Check browser console for errors

**Payment gateway stuck**
- Clear browser cache
- Verify Razorpay keys
- Check test mode is enabled

---

## Performance Benchmarks

Target metrics:
- API response: <500ms
- Page load: <2s
- Cache hit rate: >80%
- Concurrent users: 500+

---

## Reporting Issues

When reporting test failures, include:
1. Steps to reproduce
2. Expected vs actual result
3. Error messages/logs
4. Environment (OS, Node version, browser)
5. Screenshots if applicable

---

*Last Updated: February 2026*
