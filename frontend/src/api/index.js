import api from "./client";

export const authApi = {
  csrfToken: () => api.get("/auth/csrf-token"),
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  refreshToken: () => api.post("/auth/refresh-token"),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  forgotPassword: (payload) => api.post("/auth/forgot-password", payload),
  resetPassword: (payload) => api.post("/auth/reset-password", payload),
  sendOtp: (payload) => api.post("/auth/send-otp", payload),
  verifyOtp: (payload) => api.post("/auth/verify-otp", payload),
  me: () => api.get("/auth/me")
};

export const productApi = {
  list: (params) => api.get("/products", { params }),
  categories: () => api.get("/products/categories"),
  create: (payload) => api.post("/products", payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`)
};

export const couponApi = {
  publicList: () => api.get("/coupons/public"),
  apply: (payload) => api.post("/coupons/apply", payload),
  list: () => api.get("/coupons"),
  create: (payload) => api.post("/coupons", payload),
  update: (id, payload) => api.put(`/coupons/${id}`, payload)
};

export const orderApi = {
  create: (payload) => api.post("/orders", payload),
  mine: () => api.get("/orders/mine"),
  all: () => api.get("/orders"),
  exportPdf: () => api.get("/orders/export/pdf", { responseType: "blob" }),
  exportFullHistoryPdf: () => api.get("/orders/export/pdf/full-history", { responseType: "blob" }),
  listArchives: () => api.get("/orders/archives"),
  downloadArchive: (id) => api.get(`/orders/archives/${id}/download`, { responseType: "blob" }),
  updateStatus: (id, payload) => api.patch(`/orders/${id}/status`, payload),
  requestRefund: (id, payload) => api.post(`/orders/${id}/refund`, payload),
  processRefund: (id, payload) => api.patch(`/orders/${id}/refund`, payload),
  listRefunds: () => api.get("/orders/refunds/list")
};

export const orderReportApi = {
  list: (retention = "all") => api.get("/order-reports", { params: { retention } }),
  download: (fileName, inline = false) =>
    api.get(`/order-reports/${encodeURIComponent(fileName)}`, {
      params: { inline },
      responseType: "blob"
    })
};

export const paymentApi = {
  createOrder: (payload) => api.post("/payments/razorpay/create-order", payload)
};

export const adminApi = {
  revenue: () => api.get("/admin/revenue"),
  peakHours: () => api.get("/admin/peak-hours"),
  counts: () => api.get("/admin/counts"),
  users: () => api.get("/admin/users"),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};

export const offerApi = {
  list: () => api.get("/offers")
};

export const storeApi = {
  status: () => api.get("/store/status"),
  updateStatus: (payload) => api.patch("/store/status", payload)
};
