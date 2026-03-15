# Odisha Pizza Hub - API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.odishapizza.com/api`

## Authentication
Most endpoints require JWT authentication.Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### 1. User Registration
**Endpoint:** `POST /auth/register`
**Auth Required:** No

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Registered",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "role": "customer",
      "rewardPoints": 0,
      "referralCode": "ABC123DEF"
    }
  }
}
```

### 2. Email/Password Login
**Endpoint:** `POST /auth/login`
**Auth Required:** No

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Phone OTP Login
**Endpoint:** `POST /auth/phone/send-otp` &`POST /auth/phone/verify-otp`
**Auth Required:** No

**Send OTP:**
```json
{"phone": "9876543210"}
```

**Verify OTP:**
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "name": "John Doe"
}
```

### 4. Get Current User
**Endpoint:** `GET /auth/me`
**Auth Required:** Yes

---

## Product Endpoints

### 1. List Products
**Endpoint:** `GET /products`
**Auth Required:** No
**Query Parameters:** `category`, `type`, `search`

**Example:** `GET /products?category=Signature%20Pizzas&type=veg`

**Response:**
```json
{
  "message": "Products",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Odisha Special Paneer Tikka",
      "category": "Signature Pizzas",
      "type": "veg",
      "sizes": [{"label": "S", "price": 199}],
      "addons": [{"name": "Cheese Burst", "price": 79}],
      "stock": 50,
      "isAvailable": true
    }
  ]
}
```

### 2. List Categories
**Endpoint:** `GET /products/categories`
**Auth Required:** No

### 3. Create Product
**Endpoint:** `POST /products`
**Auth Required:** Yes (Admin)

### 4. Update Product
**Endpoint:** `PUT /products/:id`
**Auth Required:** Yes (Admin)

### 5. Delete Product
**Endpoint:** `DELETE /products/:id`
**Auth Required:** Yes (Admin)

---

## Order Endpoints

### 1. Create Order
**Endpoint:** `POST /orders`
**Auth Required:** Yes

**Request Body:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "size": "M",
      "qty": 2,
      "addons": ["Cheese Burst"]
    }
  ],
  "paymentMethod": "cod",
  "pickupTime": "2026-02-14T19:30:00",
  "tableBooking": "T1",
  "couponCode": "ODISHA20",
  "rewardToRedeem": 100
}
```

**Response (201):**
```json
{
  "message": "Order placed",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tokenNumber": 1001,
    "status": "pending",
    "totalAmount": 599
  }
}
```

### 2. Get My Orders
**Endpoint:** `GET /orders/mine`
**Auth Required:** Yes

### 3. Get All Orders
**Endpoint:** `GET /orders`
**Auth Required:** Yes (Admin)

### 4. Update Order Status
**Endpoint:** `PATCH /orders/:id/status`
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{"status": "preparing"}
```

---

## Coupon Endpoints

### 1. List Public Coupons
**Endpoint:** `GET /coupons/public`
**Auth Required:** No

### 2. Apply Coupon
**Endpoint:** `POST /coupons/apply`
**Auth Required:** Yes

**Request Body:**
```json
{
  "code": "ODISHA20",
  "amount": 599
}
```

### 3. Create Coupon
**Endpoint:** `POST /coupons`
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "code": "PIZZA10",
  "discountPercent": 10,
  "minOrderValue": 199,
  "maxDiscount": 80,
  "expiry": "2027-01-01",
  "isActive": true
}
```

### 4. List Coupons
**Endpoint:** `GET /coupons`
**Auth Required:** Yes (Admin)

### 5. Update Coupon
**Endpoint:** `PUT /coupons/:id`
**Auth Required:** Yes (Admin)

---

## Offer Endpoints

### 1. List Active Offers
**Endpoint:** `GET /offers`
**Auth Required:** No

### 2. Create Offer
**Endpoint:** `POST /offers`
**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "title": "Weekend Family Feast",
  "description": "Flat 25% on orders above INR 799",
  "discount": 25,
  "validFrom": "2026-01-01",
  "validTill": "2027-01-01",
  "isActive": true
}
```

### 3. Update Offer
**Endpoint:** `PUT /offers/:id`
**Auth Required:** Yes (Admin)

---

## Payment Endpoints

### 1. Create Razorpay Order
**Endpoint:** `POST /payments/razorpay/create-order`
**Auth Required:** Yes

**Request Body:**
```json
{
  "amount": 599,
  "receipt": "order_1234567890"
}
```

### 2. Razorpay Webhook
**Endpoint:** `POST /payments/razorpay/webhook`
**Auth Required:** No

---

## Admin Endpoints

### 1. Revenue Summary
**Endpoint:** `GET /admin/revenue`
**Auth Required:** Yes (Admin)

**Response:**
```json
{
  "message": "Revenue summary",
  "data": {"daily": 15000, "weekly": 105000, "monthly": 450000}
}
```

### 2. Peak Hour Heatmap
**Endpoint:** `GET /admin/peak-hours`
**Auth Required:** Yes (Admin)

### 3. Dashboard Counts
**Endpoint:** `GET /admin/counts`
**Auth Required:** Yes (Admin)

---

## QR Code Endpoint

### Generate Order QR Link
**Endpoint:** `GET /qr/order-link?table=T5`
**Auth Required:** No

**Response:**
```json
{
  "message": "QR generated",
  "data": {
    "table": "T5",
    "link": "http://localhost:5173/menu?table=T5",
    "qrDataUrl": "data:image/png;base64,..."
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{"message": "Items required"}
```

### 401 Unauthorized
```json
{"message": "Invalid or expired token"}
```

### 403 Forbidden
```json
{"message": "Forbidden"}
```

### 404 Not Found
```json
{"message": "Product not found"}
```

### 409 Conflict
```json
{"message": "User already exists"}
```

### 422 Unprocessable Entity
```json
{
  "message": "Validation failed",
  "details": [{"msg": "Invalid field"}]
}
```

### 500 Internal Server Error
```json
{"message": "Internal server error"}
```

---

## WebSocket Events

### Customer
- `join:customer` - Join customer room
- `order:update` - Receive order updates

### Admin
- `join:admin` - Join admin room
- `order:new` - New order notification
- `order:update` - Order status update

---

## Testing API

### Using cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","phone":"9876543210","password":"pass123"}'

# Get Products
curl http://localhost:5000/api/products

# Create Order (with token)
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"items":[...],"paymentMethod":"cod","pickupTime":"..."}'
```

### Using Postman
1. Setup environment with `BASE_URL = http://localhost:5000/api`
2. Create Auth collection
3. Use `{{BASE_URL}}/auth/login` for login
4. Extract token and use in subsequent requests

---

## Rate Limiting
- General API: 100 req/min
- Auth: 5 req/min
- Payment: 10 req/min

---

## Best Practices
1. Always include proper error handling
2. Use JWT tokens with Authorization header
3. Validate input data on client-side
4. Handle WebSocket connections gracefully
5. Use pagination for large datasets
6. Cache responses where appropriate
