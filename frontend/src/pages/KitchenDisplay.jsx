import { useEffect, useMemo, useState } from "react";
import { orderApi } from "../api";
import OrderNotification from "../components/OrderNotification.jsx";
import { useOrderSocket } from "../hooks/useOrderSocket.js";
import { useSoundNotification } from "../hooks/useSoundNotification.js";

const allowedStatuses = ["pending", "preparing", "ready", "completed"];

const statusTheme = {
  pending: { background: "rgba(250, 204, 21, 0.16)", color: "#a16207", border: "#facc15" },
  preparing: { background: "rgba(59, 130, 246, 0.16)", color: "#1d4ed8", border: "#60a5fa" },
  ready: { background: "rgba(34, 197, 94, 0.16)", color: "#15803d", border: "#4ade80" },
  completed: { background: "rgba(107, 114, 128, 0.18)", color: "#374151", border: "#9ca3af" }
};

const normalize = (orders = []) =>
  orders.map((order) => ({
    ...order,
    status: String(order.status || "pending").toLowerCase()
  }));

const timeAgo = (dateInput) => {
  if (!dateInput) return "just now";
  const now = Date.now();
  const then = new Date(dateInput).getTime();
  const diffSec = Math.max(1, Math.floor((now - then) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

export default function KitchenDisplay() {
  const { lastNewOrder, lastOrderUpdate, isConnected } = useOrderSocket({ isKitchen: true });
  const { playNotificationSound } = useSoundNotification();

  const [orders, setOrders] = useState([]);
  const [notification, setNotification] = useState(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [freshOrderIds, setFreshOrderIds] = useState([]);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [, setTick] = useState(0);

  useEffect(() => {
    orderApi.all().then((res) => setOrders(normalize(res.data.data || [])));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick((prev) => prev + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lastNewOrder) return;

    playNotificationSound();
    setOrders((prev) => {
      const normalized = normalize([lastNewOrder])[0];
      const existing = prev.some((order) => order._id === normalized._id);
      return existing ? prev : [normalized, ...prev];
    });

    setFreshOrderIds((prev) => [lastNewOrder._id, ...prev.filter((id) => id !== lastNewOrder._id)].slice(0, 12));
    setTimeout(() => {
      setFreshOrderIds((prev) => prev.filter((id) => id !== lastNewOrder._id));
    }, 12000);

    setNewOrderCount((prev) => prev + 1);
    setNotification({
      tone: "info",
      title: "🔔 New Order Received",
      message: `Kitchen received order #${lastNewOrder.tokenNumber || lastNewOrder._id?.slice(-6)}.`
    });
  }, [lastNewOrder, playNotificationSound]);

  useEffect(() => {
    if (!lastOrderUpdate) return;

    const normalized = normalize([lastOrderUpdate])[0];
    setOrders((prev) => {
      const idx = prev.findIndex((order) => order._id === normalized._id);
      if (idx === -1) return [normalized, ...prev];
      const next = [...prev];
      next[idx] = normalized;
      return next;
    });
  }, [lastOrderUpdate]);

  const updateStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    try {
      const { data } = await orderApi.updateStatus(orderId, { status });
      const updated = normalize([data.data])[0];
      setOrders((prev) => prev.map((order) => (order._id === updated._id ? updated : order)));
    } finally {
      setUpdatingOrderId("");
    }
  };

  const kitchenOrders = useMemo(
    () => orders.filter((order) => allowedStatuses.includes(String(order.status || "").toLowerCase())),
    [orders]
  );

  return (
    <section className="page" style={{ maxWidth: "1600px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        <div>
          <h2>Kitchen Orders</h2>
          <p className="muted">Live kitchen display for incoming and in-progress orders.</p>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "999px",
              background: isConnected ? "rgba(34,197,94,0.16)" : "rgba(239,68,68,0.16)",
              color: isConnected ? "#15803d" : "#b91c1c",
              fontWeight: 700
            }}
          >
            {isConnected ? "Socket Connected" : "Socket Disconnected"}
          </span>
          <span
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "999px",
              background: "rgba(251,191,36,0.16)",
              color: "#a16207",
              fontWeight: 700
            }}
          >
            🔔 New Orders: {newOrderCount}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <OrderNotification
          title={notification?.title || "Kitchen Alerts"}
          message={notification?.message || "Incoming orders appear here in real time with sound alerts."}
          tone={notification?.tone || "info"}
          count={newOrderCount}
          onClear={() => {
            setNewOrderCount(0);
            setNotification(null);
          }}
        />
      </div>

      {kitchenOrders.length === 0 ? <p className="muted">No kitchen orders right now.</p> : null}

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))"
        }}
      >
        {kitchenOrders.map((order) => {
          const status = String(order.status || "pending").toLowerCase();
          const theme = statusTheme[status] || statusTheme.pending;
          const isFresh = freshOrderIds.includes(order._id);

          return (
            <article
              key={order._id}
              style={{
                borderRadius: "1rem",
                padding: "1rem",
                background: "var(--card)",
                border: isFresh ? "2px solid #facc15" : `1px solid ${theme.border}`,
                boxShadow: isFresh ? "0 0 0 2px rgba(250,204,21,0.35), 0 0 22px rgba(250,204,21,0.3)" : "var(--shadow-md)",
                transition: "all 220ms ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", marginBottom: "0.9rem" }}>
                <div>
                  <h3 style={{ marginBottom: "0.35rem" }}>Order #{order.tokenNumber || order._id?.slice(-6)}</h3>
                  <p className="muted">{order.customerName || order.userId?.name || "Customer"}</p>
                  <p className="muted">{timeAgo(order.createdAt)}</p>
                </div>
                <span
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "999px",
                    background: theme.background,
                    color: theme.color,
                    fontWeight: 700,
                    textTransform: "capitalize"
                  }}
                >
                  {status}
                </span>
              </div>

              <div style={{ display: "grid", gap: "0.35rem", marginBottom: "0.9rem" }}>
                {(order.items || []).map((item, idx) => (
                  <p key={`${order._id}-${idx}`} style={{ margin: 0 }}>
                    {item.productName || item.name || "Item"} x{item.qty}
                  </p>
                ))}
              </div>

              <div style={{ marginBottom: "1rem", fontWeight: 700 }}>INR {Number(order.totalAmount || order.totalPrice || 0).toFixed(2)}</div>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                {status === "pending" ? (
                  <button type="button" onClick={() => updateStatus(order._id, "preparing")} disabled={updatingOrderId === order._id}>
                    Start Preparing
                  </button>
                ) : null}

                {status === "preparing" ? (
                  <button type="button" onClick={() => updateStatus(order._id, "ready")} disabled={updatingOrderId === order._id}>
                    Mark Ready
                  </button>
                ) : null}

                {status === "ready" ? (
                  <button type="button" onClick={() => updateStatus(order._id, "completed")} disabled={updatingOrderId === order._id}>
                    Complete Order
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
