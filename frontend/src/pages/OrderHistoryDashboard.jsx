import { useEffect, useMemo, useState } from "react";
import { orderApi, storeApi } from "../api";
import OrderNotification from "../components/OrderNotification.jsx";
import { useOrderSocket } from "../hooks/useOrderSocket.js";
import "./order-history-dashboard.css";

const tabs = ["All Orders", "Pending", "Accepted", "Rejected", "Preparing", "Ready", "Completed", "Cancelled"];

const statusToneMap = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  preparing: "preparing",
  ready: "ready",
  completed: "completed",
  cancelled: "cancelled"
};

const formatCurrency = (amount) => `INR ${Number(amount || 0).toFixed(2)}`;

const normalizeOrderRows = (orders = []) =>
  orders.map((order) => ({
    _id: order._id,
    tokenNumber: order.tokenNumber,
    items: order.items || [],
    totalAmount: Number(order.totalAmount || 0),
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt
  }));

export default function OrderHistoryDashboard() {
  const [activeTab, setActiveTab] = useState("All Orders");
  const [liveTime, setLiveTime] = useState(() => {
    const now = new Date();
    return {
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      date: `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`
    };
  });
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [storeOpen, setStoreOpen] = useState(true);

  const { lastOrderUpdate, lastStoreStatusUpdate, isConnected } = useOrderSocket();

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      setError("");
      try {
        const [ordersRes, storeRes] = await Promise.all([orderApi.mine(), storeApi.status()]);
        if (!active) return;
        setOrders(normalizeOrderRows(ordersRes?.data?.data || []));
        setStoreOpen(Boolean(storeRes?.data?.data?.isOpen));
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || "Could not load your orders");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveTime({
        time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        date: `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lastOrderUpdate) return;

    setOrders((prev) => {
      const idx = prev.findIndex((order) => order._id === lastOrderUpdate._id);
      const normalized = normalizeOrderRows([lastOrderUpdate])[0];
      if (idx === -1) return [normalized, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], ...normalized };
      return next;
    });

    if (lastOrderUpdate.status === "accepted") {
      setNotification({
        tone: "success",
        title: "Order Confirmed",
        message: `Your order #${lastOrderUpdate.tokenNumber || lastOrderUpdate._id?.slice(-6)} has been accepted by the restaurant.`
      });
    } else if (lastOrderUpdate.status === "rejected") {
      setNotification({
        tone: "error",
        title: "Order Rejected",
        message: `Your order #${lastOrderUpdate.tokenNumber || lastOrderUpdate._id?.slice(-6)} was rejected by the restaurant.`
      });
    }
  }, [lastOrderUpdate]);

  useEffect(() => {
    if (!lastStoreStatusUpdate) return;
    setStoreOpen(Boolean(lastStoreStatusUpdate.isOpen));
  }, [lastStoreStatusUpdate]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "All Orders") return orders;
    const status = activeTab.toLowerCase();
    return orders.filter((order) => String(order.status || "").toLowerCase() === status);
  }, [activeTab, orders]);

  return (
    <div className="order-history-page">
      <h1 className="order-history-title">Order History</h1>

      <div
        style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          background: storeOpen ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
          color: storeOpen ? "#15803d" : "#b91c1c",
          fontWeight: 700
        }}
      >
        {storeOpen ? "🟢 Restaurant Open" : "🔴 Restaurant Closed"}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <OrderNotification
          title={notification?.title || "Live Order Updates"}
          message={notification?.message || (isConnected ? "You will receive accepted or rejected updates here in real time." : "Connecting to live order updates...")}
          tone={notification?.tone || "info"}
          onClear={notification ? () => setNotification(null) : undefined}
        />
      </div>

      <div className="order-history-topbar">
        <div className="order-history-tabs" role="tablist" aria-label="Order tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={tab === activeTab ? "order-tab active" : "order-tab"}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="order-date-filters">
          <div className="live-datetime-chip" aria-label="Current time and date">
            <strong>{liveTime.time}</strong>
            <span>{liveTime.date}</span>
          </div>
        </div>
      </div>

      <section className="customer-orders-section" aria-label="Customer orders">
        <div className="customer-orders-header">
          <h2>Your Orders</h2>
          <p>
            Lifetime total orders: <strong>{orders.length}</strong>
          </p>
        </div>

        {loading ? <p className="muted">Loading your orders...</p> : null}
        {error ? <p className="customer-orders-error">{error}</p> : null}
        {!loading && !error && filteredOrders.length === 0 ? <p className="muted">No orders found for the selected filters.</p> : null}

        {!loading && !error && filteredOrders.length > 0 ? (
          <div className="customer-orders-table-wrap">
            <table className="customer-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const status = String(order.status || "pending").toLowerCase();
                  const statusClass = statusToneMap[status] || "pending";

                  return (
                    <tr key={order._id}>
                      <td>#{order.tokenNumber || order._id?.slice(-6)}</td>
                      <td>
                        {order.items?.length ? (
                          <div className="customer-order-items">
                            {order.items.map((item, idx) => (
                              <p key={`${order._id}-${idx}`}>
                                {item.productName || item.name || "Item"} x{item.qty}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td style={{ textTransform: "uppercase" }}>{order.paymentMethod || "cod"}</td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</td>
                      <td>
                        <span className={`order-status-badge ${statusClass}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
