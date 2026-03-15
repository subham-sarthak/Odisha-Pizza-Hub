# Architecture Guide - Odisha Pizza Hub
```
┌──────────────────┐
│ Odisha Pizza Hub │
│     System       │
├──────────────────┤
│                  │
├─ Razorpay       │ Payment Processing
│  └─ Webhook      │ Order Confirmation
│                  │
```
7. [Scalability](#scalability)
8. [Security Architecture](#security-architecture)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  React 18 + Vite with Tailwind CSS & Framer Motion          │
│  ├─ Customer Interface (Menu, Cart, Orders)                 │
│  ├─ Admin Dashboard (Analytics, Management)                 │
│  └─ Real-time Updates via Socket.io                         │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS/REST API + WebSocket
┌──────────────▼──────────────────────────────────────────────┐
│                    API LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express with JWT Authentication                  │
│  ├─ Auth Controller (Login, Register, OTP)                  │
│  ├─ Product Controller (CRUD, Filtering)                    │
│  ├─ Order Controller (Placement, Tracking)                  │
│  ├─ Payment Controller (Razorpay Integration)               │
│  ├─ Admin Controller (Analytics)                            │
│  └─ Socket.io Server (Real-time Events)                     │
└──────────────┬──────────────────────────────────────────────┘
               │ Database Queries + Cache
┌──────────────▼──────────────────────────────────────────────┐
│                    DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  ├─ MongoDB Atlas (Primary Database)                        │
│  │  ├─ Users Collection                                      │
│  │  ├─ Products Collection                                   │
│  │  ├─ Orders Collection                                     │
│  │  ├─ Coupons Collection                                    │
│  │  └─ Offers Collection                                     │
│  │                                                           │
│  └─ Redis Cloud (Cache Layer)                               │
│     └─ Product List Cache (5 min TTL)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

### Backend (`backend/src/`)

```
src/
├── app.js                    # Express app initialization
├── server.js                 # Server entry point with Socket.io
│
├── config/
│   ├── db.js                # MongoDB connection
│   ├── redis.js             # Redis client setup
│   └── env.js               # Environment variables loader
│
├── models/                   # MongoDB Schemas
│   ├── User.js              # User schema with auth methods
│   ├── Product.js           # Product schema with sizes/addons
│   ├── Order.js             # Order schema with items
│   ├── Coupon.js            # Coupon schema
│   └── Offer.js             # Offer schema
│
├── controllers/             # Business Logic
│   ├── authController.js    # Registration, login, OTP
│   ├── productController.js # Product CRUD, filtering
│   ├── orderController.js   # Order management
│   ├── couponController.js  # Coupon operations
│   ├── offerController.js   # Offer operations
│   ├── paymentController.js # Razorpay integration
│   ├── qrController.js      # QR code generation
│   └── adminController.js   # Dashboard analytics
│
├── routes/                  # API Routes
│   ├── authRoutes.js        # POST /auth/*
│   ├── productRoutes.js     # /products endpoints
│   ├── orderRoutes.js       # /orders endpoints
│   ├── couponRoutes.js      # /coupons endpoints
│   ├── offerRoutes.js       # /offers endpoints
│   ├── paymentRoutes.js     # /payments endpoints
│   ├── adminRoutes.js       # /admin endpoints
│   └── qrRoutes.js          # /qr endpoints
│
├── middleware/              # Express Middleware
│   ├── auth.js              # JWT verification & role check
│   ├── validate.js          # Input validation
│   ├── errorHandler.js      # Global error handler
│   └── (rate limiting, CORS, etc.)
│
├── services/                # Business Services
│   ├── cacheService.js      # Redis operations
│   ├── notificationService.js # Email/SMS/WhatsApp
│   └── rewardService.js     # Loyalty calculations
│
├── sockets/                 # WebSocket Events
│   └── index.js             # Socket.io connection setup
│
├── utils/                   # Utilities
│   ├── apiError.js          # Custom error class
│   ├── response.js          # Response formatter
│   ├── token.js             # JWT creation/verification
│   └── (helpers)
│
├── validators/              # Input Schemas
│   └── (Joi/Express-validator schemas)
│
└── data/
    └── menuData.js          # Seed data for products
```

### Frontend (`frontend/src/`)

```
src/
├── App.jsx                  # Main app with routing
├── main.jsx                 # React entry point
├── styles.css              # Global tailwind styles
│
├── pages/                   # Page Components
│   ├── AuthPage.jsx         # Login/Register
│   ├── MenuPage.jsx         # Product browsing (Zomato-style)
│   ├── CartPage.jsx         # Shopping cart & checkout
│   ├── CustomerDashboard.jsx # Order tracking
│   └── AdminDashboard.jsx   # Admin panel
│
├── components/              # Reusable Components
│   ├── Navbar.jsx           # Top navigation
│   ├── ProductCard.jsx      # Product display
│   └── (modal, buttons, etc.)
│
├── context/                 # State Management
│   ├── AuthContext.jsx      # Auth state & methods
│   └── CartContext.jsx      # Cart state & methods
│
├── hooks/                   # Custom React Hooks
│   └── useSocketOrders.js   # Real-time order hook
│
└── api/
    ├── client.js            # Axios instance & interceptor
    └── index.js             # API method definitions
```

---

## Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, sparse),
  phone: String (unique, sparse),
  password: String (hashed),
  role: String (enum: "admin", "customer"),
  rewardPoints: Number,
  referralCode: String (unique),
  createdAt: Date,
  updatedAt: Date
}
```

### Product Schema
```javascript
{
  _id: ObjectId,
  name: String,
  category: String (indexed),
  type: String (enum: "veg", "nonveg", indexed),
  sizes: [
    { label: String, price: Number }
  ],
  addons: [
    { name: String, price: Number }
  ],
  stock: Number,
  image: String,
  isAvailable: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  items: [
    {
      product: ObjectId (ref: Product),
      productName: String,
      size: String,
      qty: Number,
      basePrice: Number,
      addons: [{ name, price }],
      lineTotal: Number
    }
  ],
  totalAmount: Number,
  rewardUsed: Number,
  couponCode: String,
  paymentMethod: String (enum: "cod", "online"),
  paymentStatus: String (enum: "pending", "paid", "failed"),
  pickupTime: Date,
  tableBooking: String,
  tokenNumber: Number (unique),
  status: String (enum: "pending", "preparing", "ready", "completed", indexed),
  razorpayOrderId: String,
  razorpayPaymentId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Coupon Schema
```javascript
{
  _id: ObjectId,
  code: String (unique, uppercase),
  discountPercent: Number,
  minOrderValue: Number,
  maxDiscount: Number,
  expiry: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Offer Schema
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  discount: Number,
  validFrom: Date,
  validTill: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Architecture

### Layered Structure

```
Request → Middleware → Router → Controller → Service → Database
           ↓            ↓         ↓          ↓         ↓
         Auth       Route      Business   Cache/    MongoDB
         Validate   Handler    Logic      Notify    /Redis
         CORS
```

### Request & Response Format

**Request Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
X-Razorpay-Signature: {webhook_signature} (for webhooks)
```

**Response Format (Success):**
```json
{
  "message": "Human-readable message",
  "data": {...}
}
```

**Response Format (Error):**
```json
{
  "message": "Error description",
  "details": [...] // Validation errors
}
```

### Authentication Flow

```
User Input → Validation → Hash Password → Save User → JWT Token
                ↓
             Return Token → Store Locally → Axios Interceptor
                                             ↓
                                        Add to Headers
```

---

## Frontend Architecture

### State Management

```
┌─────────────────────────────────────┐
│      Provider (App.jsx)             │
├─────────────────────────────────────┤
│ └─ AuthProvider                     │
│    ├─ token: string                 │
│    ├─ user: object                  │
│    ├─ saveAuth(token, user)         │
│    └─ logout()                      │
│                                     │
│ └─ CartProvider                     │
│    ├─ items: array                  │
│    ├─ addToCart(item)               │
│    ├─ removeItem(index)             │
│    └─ clearCart()                   │
└─────────────────────────────────────┘
```

### Page Flow

```
AuthPage → MenuPage ↔ CartPage → Place Order
   ↓
Login/Register → Validate → Update Auth Context
                              ↓
                        Redirect to MenuPage

MenuPage → Select Product → Modal → Customize
             ↓
        Filter/Search → ProductCard → Add to Cart

CartPage → Review Items → Apply Coupon → Redeem Points
                           ↓
                      Checkout → Payment Gateway
                      (Razorpay or COD) → Order Placed
                      ↓
                   Redirect to Dashboard
```

---

## Database Design

### Indexing Strategy

```javascript
// User
db.users.createIndex({ email: 1 });
db.users.createIndex({ phone: 1 });
db.users.createIndex({ referralCode: 1 });

// Product
db.products.createIndex({ category: 1, type: 1 });
db.products.createIndex({ isAvailable: 1 });
db.products.createIndex({ name: "text" }); // Text search

// Order
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ tokenNumber: 1 });
db.orders.createIndex({ createdAt: -1 }); // Time-range queries

// Coupon
db.coupons.createIndex({ code: 1 });
db.coupons.createIndex({ isActive: 1, expiry: 1 });

// Offer
db.offers.createIndex({ isActive: 1, validFrom: 1, validTill: 1 });
```

### Data Access Patterns

**Frequent Queries:**
1. Get all products (cached)
2. Get user's orders (indexed: userId, createdAt)
3. Find orders by status (indexed: status)
4. Validate coupon (indexed: code)
5. Check product availability (indexed: isAvailable)

---

## Scalability

### Horizontal Scaling

```
Load Balancer
    ↓
┌───────────────────────────────┐
│ Backend Instance 1            │
│ ├─ Express Server             │
│ ├─ Socket.io Namespace 1      │
│ └─ Queue Worker               │
│                               │
├─ Backend Instance 2           │
├─ Backend Instance 3           │
│ ... (N instances)             │
│                               │
├─ Shared: MongoDB, Redis       │
└───────────────────────────────┘
```

### Caching Strategy

```
Request → Redis Cache
            ↓
         Hit? Yes → Return Cached Data
         ↓
         No → Query MongoDB
              ↓
         Cache Result → Return
```

**Cache Invalidation:**
- Product list: 5-minute TTL
- Manual invalidation on product changes
- User-specific data: No cache (personal)

### Database Optimization

- **Connection Pooling**: Mongoose handles automatically
- **Lean Queries**: Select only needed fields
- **Aggregation Pipeline**: For complex analytics
- **Batch Operations**: Bulk inserts for seed data
- **Query Optimization**: Proper indexing

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────┐
│   User Credentials  │
└──────────┬──────────┘
           ↓
    ┌─────────────────┐
    │ Validate Input  │
    │ Hash Password   │
    │ Create JWT      │
    └────────┬────────┘
             ↓
   ┌──────────────────────┐
   │  JWT in Header       │
   │  (on each request)   │
   └────────┬─────────────┘
            ↓
   ┌──────────────────────┐
   │ Verify JWT Signature │
   │ Check Expiry         │
   │ Extract Payload      │
   └────────┬─────────────┘
            ↓
   ┌──────────────────────┐
   │ Check User Role      │
   │ Access Control       │
   └──────────────────────┘
```

### Data Protection

1. **In Transit**: HTTPS/TLS
2. **At Rest**: MongoDB encryption
3. **Passwords**: bcrypt with 10 salt rounds
4. **Secrets**: Environment variables
5. **API Keys**: Securely stored Razorpay keys

### Threat Mitigation

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Mongoose parameterized queries |
| XSS | Input sanitization, React escaping |
| CSRF | CORS validation, HTTPS |
| Brute Force | Rate limiting (5 attempts/min) |
| DDoS | Cloudflare protection (production) |
| Webhook Spoofing | HMAC-SHA256 signature verification |

---

## Integration Points

### External Services

```
┌──────────────────┐
│ Odisha Pizza Hub │
│     System       │
├──────────────────┤
│                  │
├─ Razorpay       │ Payment Processing
│  └─ Webhook      │ Order Confirmation
│                  │
├─ Email Service  │ Notifications
│  (SendGrid/SMTP)│
│                  │
├─ SMS Service    │ SMS Updates
│  (Twilio/AWS)   │
│                  │
└──────────────────┘
```

---

## Extension Points

### Adding New Features

1. **New Entity Type**:
   - Create model in `models/`
   - Create controller in `controllers/`
   - Create routes in `routes/`
   - Add to API documentation

2. **New Notification Channel**:
   - Extend `notificationService.js`
   - Add provider configuration
   - Update environment variables

3. **New Admin Report**:
   - Add aggregation in `adminController.js`
   - Add endpoint in `adminRoutes.js`
   - Create chart component in frontend

4. **New Socket Event**:
   - Emit in appropriate controller
   - Handle in frontend via `useSocketOrders`

---

## Performance Considerations

### Frontend
- Code splitting with lazy loading
- Image optimization and CDN
- Browser caching (long TTL for static)
- Minification and compression

### Backend
- Query optimization with indexing
- Connection pooling
- Response caching
- Async operations with promises
- Worker processes for heavy tasks

### Database
- Proper indexing strategy
- Document denormalization where appropriate
- Archive old data periodically
- Monitor slow queries

---

## Monitoring & Observability

### Key Metrics
- API response time
- Error rates by endpoint
- Cache hit ratio
- Number of concurrent connections
- Database query latency
- Payment success rate

### Logging Strategy
```javascript
// Info: Important business events
logger.info(`Order placed: ${orderId}`);

// Error: System errors
logger.error(`Database connection failed: ${error}`);

// Debug: Development troubleshooting
logger.debug(`Product filter: category=${category}, type=${type}`);
```

---

*Last Updated: February 2026*
