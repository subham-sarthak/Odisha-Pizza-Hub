import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminApi, couponApi, orderApi, productApi, storeApi } from "../api";
import OrderNotification from "../components/OrderNotification.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useOrderSocket } from "../hooks/useOrderSocket.js";
import { useSoundNotification } from "../hooks/useSoundNotification.js";

const analyticsStatuses = ["pending", "accepted", "rejected", "preparing", "ready", "completed"];
const actionStatuses = ["accepted", "rejected", "preparing", "ready", "completed", "cancelled"];

const emptyProduct = {
  name: "",
  category: "",
  type: "veg",
  stock: 10,
  image: "",
  isAvailable: true,
  sizes: [
    { label: "S", price: 150 },
    { label: "M", price: 250 },
    { label: "L", price: 350 },
    { label: "XL", price: 450 }
  ],
  addons: [{ name: "Cheese Burst", price: 79 }]
};

const formatCurrency = (amount) => `INR ${Number(amount || 0).toFixed(2)}`;

const triggerBlobDownload = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const escapePdfText = (text) => String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const createSimplePdfBlob = (title, lines = []) => {
  const safeTitle = escapePdfText(title);
  const contentLines = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    `(${safeTitle}) Tj`,
    "ET"
  ];

  let y = 758;
  lines.forEach((line) => {
    contentLines.push("BT");
    contentLines.push("/F1 12 Tf");
    contentLines.push(`50 ${y} Td`);
    contentLines.push(`(${escapePdfText(line)}) Tj`);
    contentLines.push("ET");
    y -= 22;
  });

  const content = `${contentLines.join("\n")}\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};

const formatOrderDate = (dateInput) => {
  if (!dateInput) return "-";
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatOrderTime = (dateInput) => {
  if (!dateInput) return "-";
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatCustomerTimestamp = (dateInput) => {
  if (!dateInput) return "-";
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const statusStyles = {
  pending: { background: "rgba(245, 158, 11, 0.14)", color: "#b45309" },
  accepted: { background: "rgba(34, 197, 94, 0.14)", color: "#15803d" },
  rejected: { background: "rgba(239, 68, 68, 0.14)", color: "#b91c1c" },
  preparing: { background: "rgba(59, 130, 246, 0.14)", color: "#1d4ed8" },
  ready: { background: "rgba(168, 85, 247, 0.14)", color: "#7e22ce" },
  completed: { background: "rgba(16, 185, 129, 0.14)", color: "#047857" },
  cancelled: { background: "rgba(107, 114, 128, 0.14)", color: "#374151" }
};

const refundStatusStyles = {
  requested: { background: "rgba(249, 115, 22, 0.14)", color: "#c2410c" },
  completed: { background: "rgba(34, 197, 94, 0.14)", color: "#15803d" },
  rejected: { background: "rgba(239, 68, 68, 0.14)", color: "#b91c1c" }
};

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { lastNewOrder, lastOrderUpdate, lastStoreStatusUpdate, lastRevenueUpdate, isConnected } = useOrderSocket({ isAdmin: true });
  const { playNotificationSound } = useSoundNotification();

  const [revenue, setRevenue] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
  const [heatmap, setHeatmap] = useState([]);
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [counts, setCounts] = useState({});
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [coupons, setCoupons] = useState([]);
  const [notification, setNotification] = useState(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [freshOrderIds, setFreshOrderIds] = useState([]);
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeUpdating, setStoreUpdating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");
  const [showCustomers, setShowCustomers] = useState(false);

  const load = async () => {
    const [rev, peak, allOrders, adminCounts, prods, cps, refs, storeStatusRes] = await Promise.all([
      adminApi.revenue(),
      adminApi.peakHours(),
      orderApi.all(),
      adminApi.counts(),
      productApi.list(),
      couponApi.list(),
      orderApi.listRefunds(),
      storeApi.status()
    ]);

    setRevenue(rev.data.data);
    setHeatmap(peak.data.data);
    setOrders(allOrders.data.data);
    setCounts(adminCounts.data.data);
    setProducts(prods.data.data);
    setCoupons(cps.data.data);
    setRefunds(refs.data.data);
    setStoreOpen(Boolean(storeStatusRes?.data?.data?.isOpen));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!lastNewOrder) return;

    playNotificationSound();
    setOrders((prev) => {
      const exists = prev.some((order) => order._id === lastNewOrder._id);
      return exists ? prev : [lastNewOrder, ...prev];
    });
    setFreshOrderIds((prev) => [lastNewOrder._id, ...prev.filter((id) => id !== lastNewOrder._id)].slice(0, 12));
    setTimeout(() => {
      setFreshOrderIds((prev) => prev.filter((id) => id !== lastNewOrder._id));
    }, 12000);
    setNewOrderCount((prev) => prev + 1);
    setNotification({
      tone: "info",
      title: "New Order Received",
      message: `Order #${lastNewOrder.tokenNumber || lastNewOrder._id?.slice(-6)} from ${lastNewOrder.userId?.name || "Customer"}`
    });
  }, [lastNewOrder, playNotificationSound]);

  useEffect(() => {
    if (!lastOrderUpdate) return;

    setOrders((prev) => {
      const idx = prev.findIndex((order) => order._id === lastOrderUpdate._id);
      if (idx === -1) return [lastOrderUpdate, ...prev];
      const next = [...prev];
      next[idx] = lastOrderUpdate;
      return next;
    });
  }, [lastOrderUpdate]);

  useEffect(() => {
    if (!lastStoreStatusUpdate) return;
    setStoreOpen(Boolean(lastStoreStatusUpdate.isOpen));
  }, [lastStoreStatusUpdate]);

  useEffect(() => {
    if (!lastRevenueUpdate) return;
    setRevenue(lastRevenueUpdate);
  }, [lastRevenueUpdate]);

  const updateStoreStatus = async (nextStatus) => {
    setStoreUpdating(true);
    try {
      const { data } = await storeApi.updateStatus({ isOpen: nextStatus });
      const nextStoreState = Boolean(data?.data?.isOpen);
      setStoreOpen(nextStoreState);
      setNotification({
        tone: nextStoreState ? "success" : "error",
        title: "Store Status Updated",
        message: nextStoreState ? "🟢 Store Open" : "🔴 Store Closed"
      });
    } finally {
      setStoreUpdating(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingOrderId(id);
    try {
      const { data } = await orderApi.updateStatus(id, { status });
      const updated = data.data;
      setOrders((prev) => prev.map((order) => (order._id === id ? updated : order)));
      setNotification({
        tone: status === "rejected" ? "error" : "success",
        title: status === "rejected" ? "Order Rejected" : "Order Updated",
        message: `Order #${updated.tokenNumber || updated._id?.slice(-6)} is now ${status}.`
      });
    } finally {
      setUpdatingOrderId("");
    }
  };

  const deleteOrderTemporarily = (id) => {
    setOrders((prev) => prev.filter((order) => order._id !== id));
    setNotification({
      tone: "info",
      title: "Order Hidden",
      message: `Order #${id?.slice(-6)} removed from this view temporarily.`
    });
  };

  const processRefund = async (id, status, amount) => {
    await orderApi.processRefund(id, { status, amount });
    await load();
  };

  const fetchCustomerDetails = async () => {
    setCustomersLoading(true);
    setCustomersError("");
    try {
      const { data } = await adminApi.users();
      setCustomerDetails(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setCustomersError(error?.response?.data?.message || "Unable to load customer details.");
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}" from the database? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(id);
      setCustomerDetails((prev) => prev.filter((c) => c._id !== id));
      setNotification({ tone: "success", title: "User Deleted", message: `"${name}" has been permanently removed.` });
    } catch (error) {
      setNotification({ tone: "error", title: "Delete Failed", message: error?.response?.data?.message || "Could not delete user." });
    }
  };

  const toggleCustomersPanel = async () => {
    const nextVisible = !showCustomers;
    setShowCustomers(nextVisible);
    if (nextVisible && customerDetails.length === 0 && !customersLoading) {
      await fetchCustomerDetails();
    }
  };

  const downloadAllOrdersPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await orderApi.exportPdf();
      const fileName = `all-orders-${new Date().toISOString().slice(0, 10)}.pdf`;
      triggerBlobDownload(response.data, fileName);
      setNotification({
        tone: "success",
        title: "All Orders PDF Ready",
        message: "Active orders report downloaded successfully."
      });
    } catch (error) {
      setNotification({
        tone: "error",
        title: "PDF Download Failed",
        message: error?.response?.data?.message || "Could not download all orders PDF."
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const createProduct = async () => {
    await productApi.create(productForm);
    setProductForm(emptyProduct);
    const response = await productApi.list();
    setProducts(response.data.data);
  };

  const pendingOrders = useMemo(
    () => orders.filter((order) => String(order.status || "").toLowerCase() === "pending"),
    [orders]
  );

  const statusCounts = useMemo(
    () => analyticsStatuses.map((status) => ({ name: status, count: orders.filter((order) => order.status === status).length })),
    [orders]
  );

  const recentOrders = useMemo(() => {
    const now = new Date();
    const todayReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);
    const cutoff = now >= todayReset
      ? todayReset
      : new Date(todayReset.getTime() - 24 * 60 * 60 * 1000);
    return orders.filter((order) => new Date(order.createdAt).getTime() >= cutoff.getTime());
  }, [orders]);

  const yearlyRevenue = useMemo(() => {
    if (revenue.yearly !== undefined && revenue.yearly !== null) {
      return Number(revenue.yearly || 0);
    }

    const currentYear = new Date().getFullYear();
    return orders.reduce((sum, order) => {
      const dt = new Date(order.createdAt);
      if (Number.isNaN(dt.getTime()) || dt.getFullYear() !== currentYear) return sum;
      return sum + Number(order.totalAmount || order.totalPrice || 0);
    }, 0);
  }, [orders, revenue.yearly]);

  const exportRevenuePdf = () => {
    const now = new Date();
    const reportLines = [
      `Generated On: ${now.toLocaleDateString("en-IN")} ${now.toLocaleTimeString("en-IN")}`,
      "",
      `Daily Revenue: ${formatCurrency(revenue.daily)}`,
      `Weekly Revenue: ${formatCurrency(revenue.weekly)}`,
      `Monthly Revenue: ${formatCurrency(revenue.monthly)}`,
      `Yearly Revenue: ${formatCurrency(yearlyRevenue)}`
    ];

    const blob = createSimplePdfBlob("Odisha Pizza Hub Revenue Report", reportLines);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `revenue-report-${now.toISOString().slice(0, 10)}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);

    setNotification({
      tone: "success",
      title: "Revenue PDF Saved",
      message: "Daily, weekly, monthly, and yearly revenue report downloaded as PDF."
    });
  };

  return (
    <section className="page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}
      >
        <div>
          <h2>Admin Dashboard</h2>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Real-time order monitoring, acceptance workflow, and business operations.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <motion.button
            type="button"
            onClick={() => navigate("/admin/order-reports")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary"
            style={{ padding: "0.6rem 1rem", borderRadius: "0.75rem", fontWeight: 700 }}
          >
            Order Reports
          </motion.button>
          <span
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: "999px",
              background: isConnected ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
              color: isConnected ? "#15803d" : "#b91c1c",
              fontWeight: 700
            }}
          >
            {isConnected ? "Socket Connected" : "Socket Disconnected"}
          </span>
          <motion.button
            onClick={async () => {
              await logout();
              navigate("/admin-login", { replace: true });
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#b91c1c",
              borderRadius: "0.75rem",
              padding: "0.6rem 1.25rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Logout
          </motion.button>
        </div>
      </motion.div>

      <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
        <OrderNotification
          title="New Order Received"
          message={notification?.message || "Listen for new orders and process them the moment they arrive."}
          tone={notification?.tone || "info"}
          count={newOrderCount}
          onClear={() => {
            setNewOrderCount(0);
            setNotification(null);
          }}
        />
      </div>

      <div className="stats-grid">
        {[
          { title: "Daily Revenue", value: formatCurrency(revenue.daily), color: "var(--brand)" },
          { title: "Weekly Revenue", value: formatCurrency(revenue.weekly), color: "var(--accent)" },
          { title: "Monthly Revenue", value: formatCurrency(revenue.monthly), color: "#16a34a" },
          { title: "Yearly Revenue", value: formatCurrency(yearlyRevenue), color: "#0ea5e9" },
          { title: "Total Orders", value: counts.orders || 0, color: "#0284c7" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            className="stat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <h3 style={{ color: "var(--muted)", fontSize: "0.92rem" }}>{stat.title}</h3>
            <p style={{ fontSize: "1.9rem", fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button type="button" onClick={exportRevenuePdf}>
          Export Revenue PDF
        </button>
      </div>

      <div className="admin-grid">
        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Revenue Graph</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[{ name: "Revenue", ...revenue }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip />
              <Bar dataKey="daily" fill="#ff6b35" />
              <Bar dataKey="weekly" fill="#ff9f43" />
              <Bar dataKey="monthly" fill="#22c55e" />
              <Bar dataKey="yearly" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Peak Hour Heatmap</h3>
          <div className="heatmap">
            {Array.from({ length: 24 }).map((_, hour) => {
              const row = heatmap.find((item) => item.hour === hour);
              const level = row?.orders || 0;
              return (
                <div
                  key={hour}
                  style={{
                    opacity: Math.min(1, 0.16 + level / 10),
                    background: "linear-gradient(135deg, var(--brand), var(--accent))"
                  }}
                >
                  {hour}:00
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <h3 style={{ marginBottom: "0.9rem" }}>Store Control</h3>
          <p className="muted" style={{ marginBottom: "1rem" }}>Open or close ordering for customers in real time.</p>
          <p
            style={{
              marginBottom: "1rem",
              fontWeight: 700,
              color: storeOpen ? "#15803d" : "#b91c1c"
            }}
          >
            {storeOpen ? "🟢 Store Open" : "🔴 Store Closed"}
          </p>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <button type="button" onClick={() => updateStoreStatus(true)} disabled={storeUpdating || storeOpen}>
              Open Store
            </button>
            <button type="button" className="btn-secondary" onClick={() => updateStoreStatus(false)} disabled={storeUpdating || !storeOpen}>
              Close Store
            </button>
          </div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ gridColumn: "1 / -1" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <div>
              <h3>New Orders</h3>
              <p className="muted">Incoming customer orders appear here instantly.</p>
            </div>
            <span
              style={{
                alignSelf: "start",
                padding: "0.5rem 0.85rem",
                borderRadius: "999px",
                background: "rgba(255,107,53,0.12)",
                color: "#c2410c",
                fontWeight: 700
              }}
            >
              🔔 New Orders: {newOrderCount}
            </span>
          </div>

          {pendingOrders.length === 0 ? (
            <p className="muted">No pending orders right now.</p>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {pendingOrders.map((order) => (
                <motion.article
                  key={order._id}
                  animate={
                    freshOrderIds.includes(order._id)
                      ? { boxShadow: ["0 0 0 1px rgba(251,191,36,0.2)", "0 0 0 3px rgba(251,191,36,0.9)", "0 0 0 1px rgba(251,191,36,0.2)"] }
                      : { boxShadow: "0 0 0 1px rgba(255,107,53,0.12)" }
                  }
                  transition={
                    freshOrderIds.includes(order._id)
                      ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.2 }
                  }
                  style={{
                    border: freshOrderIds.includes(order._id) ? "2px solid rgba(251,191,36,0.95)" : "1px solid rgba(255,107,53,0.14)",
                    borderRadius: "1rem",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.03)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
                    <div>
                      <h4 style={{ marginBottom: "0.3rem" }}>Order #{order.tokenNumber || order._id?.slice(-6)}</h4>
                      <p style={{ margin: 0, color: "var(--muted)" }}>
                        {order.userId?.name || "Customer"} | {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Just now"}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        ...statusStyles.pending
                      }}
                    >
                      Pending
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: "0.35rem", marginBottom: "0.9rem" }}>
                    {Array.isArray(order.items) && order.items.length ? (
                      order.items.map((item, index) => (
                        <p key={`${order._id}-${index}`} style={{ margin: 0 }}>
                          {item.productName || item.name || "Item"} x{item.qty}
                        </p>
                      ))
                    ) : (
                      <p style={{ margin: 0 }}>No items listed</p>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    <strong>{formatCurrency(order.totalAmount || order.totalPrice)}</strong>
                    <span style={{ color: "var(--muted)" }}>Status: Pending</span>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => updateStatus(order._id, "accepted")}
                      disabled={updatingOrderId === order._id}
                    >
                      Accept Order
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => updateStatus(order._id, "rejected")}
                      disabled={updatingOrderId === order._id}
                    >
                      Reject Order
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ gridColumn: "1 / -1" }}
        >
          <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ marginBottom: "0.3rem" }}>Recent Orders</h3>
              <p className="muted">Orders placed since the last 11:59 PM reset. Clears every day at 11:59 PM.</p>
            </div>
            <span style={{
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              background: recentOrders.length > 0 ? "rgba(255,107,53,0.14)" : "rgba(255,255,255,0.06)",
              color: recentOrders.length > 0 ? "#ff6b35" : "var(--muted)",
              fontWeight: 700,
              fontSize: "0.92rem",
              whiteSpace: "nowrap"
            }}>
              Total Orders: {recentOrders.length}
            </span>
          </div>

          {recentOrders.length === 0 ? (
            <p className="muted">No orders since the last 11:59 PM reset.</p>
          ) : (
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "29rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Order Date</th>
                    <th>Order Time</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const style = statusStyles[order.status] || statusStyles.pending;
                    return (
                      <tr key={order._id}>
                        <td>#{order.tokenNumber || order._id?.slice(-6)}</td>
                        <td>{order.userId?.name || "Customer"}</td>
                        <td>
                          {Array.isArray(order.items) && order.items.length
                            ? order.items.map((item) => `${item.productName || item.name || "Item"} x${item.qty}`).join(", ")
                            : "-"}
                        </td>
                        <td>{formatCurrency(order.totalAmount || order.totalPrice)}</td>
                        <td>{formatOrderDate(order.createdAt)}</td>
                        <td>{formatOrderTime(order.createdAt)}</td>
                        <td>
                          <span
                            style={{
                              padding: "0.3rem 0.7rem",
                              borderRadius: "999px",
                              fontWeight: 700,
                              fontSize: "0.84rem",
                              ...style
                            }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                            <select
                              value={order.status}
                              onChange={(event) => updateStatus(order._id, event.target.value)}
                              disabled={updatingOrderId === order._id}
                              style={{ minWidth: "10rem" }}
                            >
                              {actionStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ gridColumn: "1 / -1" }}
        >
          <div
            style={{
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap"
            }}
          >
            <h3 style={{ margin: 0 }}>All Orders History</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" onClick={downloadAllOrdersPdf} disabled={pdfLoading}>
                {pdfLoading ? "Preparing PDF..." : "All Orders PDF"}
              </button>
            </div>
          </div>
          {orders.length === 0 ? (
            <p className="muted">No orders available.</p>
          ) : (
            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "29rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Order Date</th>
                    <th>Order Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const style = statusStyles[order.status] || statusStyles.pending;

                    return (
                      <tr key={order._id}>
                        <td>#{order.tokenNumber || order._id?.slice(-6)}</td>
                        <td>{order.userId?.name || "Customer"}</td>
                        <td>
                          {Array.isArray(order.items) && order.items.length
                            ? order.items.map((item) => `${item.productName || item.name || "Item"} x${item.qty}`).join(", ")
                            : "-"}
                        </td>
                        <td>{formatCurrency(order.totalAmount || order.totalPrice)}</td>
                        <td>{formatOrderDate(order.createdAt)}</td>
                        <td>{formatOrderTime(order.createdAt)}</td>
                        <td>
                          <span
                            style={{
                              padding: "0.3rem 0.7rem",
                              borderRadius: "999px",
                              fontWeight: 700,
                              fontSize: "0.84rem",
                              ...style
                            }}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Add Product</h3>
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <input placeholder="Product Name" value={productForm.name} onChange={(event) => setProductForm((state) => ({ ...state, name: event.target.value }))} />
            <input placeholder="Category" value={productForm.category} onChange={(event) => setProductForm((state) => ({ ...state, category: event.target.value }))} />
            <select value={productForm.type} onChange={(event) => setProductForm((state) => ({ ...state, type: event.target.value }))}>
              <option value="veg">Veg</option>
              <option value="nonveg">Non-Veg</option>
            </select>
            <input type="number" placeholder="Stock" value={productForm.stock} onChange={(event) => setProductForm((state) => ({ ...state, stock: Number(event.target.value) }))} />
            <input placeholder="Image URL" value={productForm.image} onChange={(event) => setProductForm((state) => ({ ...state, image: event.target.value }))} />
            <button type="button" onClick={createProduct}>Create Product</button>
            <p className="muted">Total products: {products.length}</p>
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Business Stats</h3>
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.75rem" }}>
              <p className="muted">Products</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{counts.products || 0}</p>
            </div>
            <div
              style={{
                padding: "1rem",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "0.75rem",
                border: showCustomers ? "1px solid rgba(255,107,53,0.35)" : "1px solid transparent",
                cursor: "pointer"
              }}
              role="button"
              tabIndex={0}
              onClick={toggleCustomersPanel}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleCustomersPanel();
                }
              }}
            >
              <p className="muted">Users</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.6rem" }}>{counts.users || 0}</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleCustomersPanel();
                }}
              >
                {showCustomers ? "Hide Customer Details" : "View Customer Details"}
              </button>
            </div>
            <div style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.75rem" }}>
              <p className="muted">Coupons</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{coupons.length}</p>
            </div>
          </div>
        </motion.div>

        {showCustomers ? (
          <motion.div
            className="card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ gridColumn: "1 / -1" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ marginBottom: "0.35rem" }}>Customer Details</h3>
                <p className="muted">Customer profile and order activity overview.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={fetchCustomerDetails} disabled={customersLoading}>
                {customersLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {customersLoading ? <p className="muted">Loading customer details...</p> : null}
            {!customersLoading && customersError ? <p style={{ color: "#b91c1c" }}>{customersError}</p> : null}
            {!customersLoading && !customersError && customerDetails.length === 0 ? <p className="muted">No customers found.</p> : null}

            {!customersLoading && !customersError && customerDetails.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Last Order</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerDetails.map((customer) => (
                      <tr key={customer._id}>
                        <td>{customer.name || "-"}</td>
                        <td>{customer.email || "-"}</td>
                        <td>{customer.phone || "-"}</td>
                        <td>
                          <span
                            style={{
                              padding: "0.25rem 0.65rem",
                              borderRadius: "999px",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              background: customer.role === "admin" ? "rgba(239,68,68,0.14)" : "rgba(34,197,94,0.14)",
                              color: customer.role === "admin" ? "#b91c1c" : "#15803d"
                            }}
                          >
                            {customer.role || "customer"}
                          </span>
                        </td>
                        <td>{formatCustomerTimestamp(customer.createdAt)}</td>
                        <td>{customer.totalOrders || 0}</td>
                        <td>{formatCurrency(customer.totalSpent || 0)}</td>
                        <td>{formatCustomerTimestamp(customer.lastOrderAt)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(customer._id, customer.name || customer.email)}
                            style={{
                              border: "1px solid rgba(239,68,68,0.45)",
                              background: "rgba(239,68,68,0.12)",
                              color: "#b91c1c",
                              borderRadius: "0.6rem",
                              padding: "0.35rem 0.75rem",
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              cursor: "pointer"
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </motion.div>
        ) : null}

        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ gridColumn: "1 / -1" }}
        >
          <h3 style={{ marginBottom: "1.25rem" }}>Refund Management</h3>
          {refunds.length === 0 ? (
            <p className="muted">No refund requests.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.slice(0, 8).map((refund) => {
                    const style = refundStatusStyles[refund.refundStatus] || refundStatusStyles.requested;

                    return (
                      <tr key={refund._id}>
                        <td>#{refund.tokenNumber || refund._id?.slice(-6)}</td>
                        <td>{formatCurrency(refund.refundAmount)}</td>
                        <td>{refund.refundReason || "-"}</td>
                        <td>
                          <span
                            style={{
                              padding: "0.3rem 0.7rem",
                              borderRadius: "999px",
                              fontWeight: 700,
                              fontSize: "0.84rem",
                              ...style
                            }}
                          >
                            {refund.refundStatus}
                          </span>
                        </td>
                        <td>
                          {refund.refundStatus === "requested" ? (
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <button type="button" onClick={() => processRefund(refund._id, "approved", refund.refundAmount)}>
                                Approve
                              </button>
                              <button type="button" className="btn-secondary" onClick={() => processRefund(refund._id, "rejected")}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="muted">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
