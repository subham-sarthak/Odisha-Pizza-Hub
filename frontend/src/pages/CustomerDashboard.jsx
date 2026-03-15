import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi, storeApi } from "../api";
import OrderNotification from "../components/OrderNotification.jsx";
import { useAuth } from "../context/AuthContext";
import { useOrderSocket } from "../hooks/useOrderSocket.js";

const progressStyles = {
  pending: "linear-gradient(135deg, var(--brand), var(--accent))",
  accepted: "linear-gradient(135deg, #22c55e, #16a34a)",
  rejected: "linear-gradient(135deg, #ef4444, #dc2626)",
  completed: "linear-gradient(135deg, #22c55e, #16a34a)"
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [refundReason, setRefundReason] = useState("");
  const [refundOrderId, setRefundOrderId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [storeOpen, setStoreOpen] = useState(true);
  const { lastOrderUpdate, lastStoreStatusUpdate } = useOrderSocket();

  useEffect(() => {
    orderApi.mine().then((res) => setOrders(res.data.data));
    storeApi.status().then((res) => setStoreOpen(Boolean(res?.data?.data?.isOpen)));
  }, []);

  useEffect(() => {
    if (!lastOrderUpdate) return;

    setOrders((prev) => {
      const idx = prev.findIndex((order) => order._id === lastOrderUpdate._id);
      if (idx === -1) return [lastOrderUpdate, ...prev];
      const next = [...prev];
      next[idx] = lastOrderUpdate;
      return next;
    });

    if (lastOrderUpdate.status === "accepted") {
      setNotification({
        tone: "success",
        title: "Your order has been confirmed",
        message: `Order #${lastOrderUpdate.tokenNumber || lastOrderUpdate._id?.slice(-6)} is accepted and being processed.`
      });
    } else if (lastOrderUpdate.status === "rejected") {
      setNotification({
        tone: "error",
        title: "Your order was rejected",
        message: `Order #${lastOrderUpdate.tokenNumber || lastOrderUpdate._id?.slice(-6)} was rejected by the restaurant.`
      });
    }
  }, [lastOrderUpdate]);

  useEffect(() => {
    if (!lastStoreStatusUpdate) return;
    const isOpen = Boolean(lastStoreStatusUpdate.isOpen);
    setStoreOpen(isOpen);
    setNotification({
      tone: isOpen ? "success" : "error",
      title: isOpen ? "🟢 Restaurant Open" : "🔴 Restaurant Closed",
      message: isOpen ? "You can place new orders now." : "Ordering is currently unavailable."
    });
  }, [lastStoreStatusUpdate]);

  const activeOrder = useMemo(
    () => orders.find((order) => !["completed", "rejected", "cancelled"].includes(order.status)),
    [orders]
  );

  const requestRefund = async (orderId) => {
    if (!refundReason.trim()) {
      alert("Please provide a reason for refund");
      return;
    }

    try {
      await orderApi.requestRefund(orderId, { reason: refundReason });
      alert("Refund request submitted successfully");
      setRefundReason("");
      setRefundOrderId(null);
      const response = await orderApi.mine();
      setOrders(response.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to request refund");
    }
  };

  const getStatusStep = (status) => {
    const steps = { pending: 0, accepted: 1, confirmed: 1, preparing: 2, ready: 3, completed: 4 };
    return steps[status] || 0;
  };

  const statusLabels = ["Pending", "Confirmed", "Preparing", "Ready", "Completed"];

  return (
    <section className="page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2>My Dashboard</h2>
        <motion.div
          style={{
            marginTop: "0.85rem",
            marginBottom: "0.6rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            background: storeOpen ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.14)",
            color: storeOpen ? "#15803d" : "#b91c1c",
            fontWeight: 700
          }}
        >
          {storeOpen ? "🟢 Restaurant Open" : "🔴 Restaurant Closed"}
        </motion.div>
        <motion.button
          type="button"
          onClick={() => navigate("/menu")}
          disabled={!storeOpen}
          style={{ width: "100%", marginBottom: "1rem", opacity: storeOpen ? 1 : 0.6 }}
          whileHover={storeOpen ? { scale: 1.01 } : undefined}
          whileTap={storeOpen ? { scale: 0.98 } : undefined}
        >
          Order Now
        </motion.button>
        <div style={{ margin: "1rem 0 1.5rem" }}>
          <OrderNotification
            title={notification?.title || "Order Updates"}
            message={notification?.message || "We will show live accepted or rejected updates here for your orders."}
            tone={notification?.tone || "info"}
            onClear={notification ? () => setNotification(null) : undefined}
          />
        </div>
        <motion.div
          style={{
            background: "linear-gradient(135deg, var(--brand), var(--accent))",
            padding: "1.5rem",
            borderRadius: "1rem",
            marginBottom: "2rem",
            color: "white"
          }}
          whileHover={{ scale: 1.02 }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>Reward Points</h3>
          <p style={{ fontSize: "2rem", fontWeight: 700 }}>{user?.rewardPoints || 0}</p>
        </motion.div>
      </motion.div>

      {activeOrder ? (
        <motion.div
          className="card"
          style={{ marginBottom: "2rem", padding: "2rem" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h3 style={{ marginBottom: "1.5rem" }}>Live Order - Token #{activeOrder.tokenNumber}</h3>
          <div className="progress-steps">
            {statusLabels.map((label, idx) => {
              const currentStep = getStatusStep(activeOrder.status);
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <div key={label} className="step-wrap" style={{ flex: 1, position: "relative" }}>
                  <div className={`step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                    {isCompleted ? "OK" : idx + 1}
                  </div>
                  <p className="step-label">{label}</p>
                  {idx < statusLabels.length - 1 ? <div className={`progress-line ${isCompleted ? "completed" : ""}`}></div> : null}
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : null}

      <h3 style={{ marginBottom: "1.5rem" }}>Order History</h3>
      <div className="order-list">
        {orders.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>No orders yet. Start ordering now.</p>
        ) : (
          orders.map((order, idx) => (
            <motion.article
              key={order._id}
              className="order-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem", gap: "1rem" }}>
                <div>
                  <h4 style={{ marginBottom: "0.25rem" }}>Token #{order.tokenNumber}</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    background: progressStyles[order.status] || "linear-gradient(135deg, var(--brand), var(--accent))",
                    color: "white",
                    textTransform: "capitalize"
                  }}
                >
                  {order.status}
                </span>
              </div>

              <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
                <p>Amount: INR {order.totalAmount}</p>
                <p>Pickup: {new Date(order.pickupTime).toLocaleString()}</p>
                <p>Payment: {order.paymentStatus}</p>
                {order.tableBooking ? <p>Table: {order.tableBooking}</p> : null}
              </div>

              {order.refundStatus !== "none" ? (
                <motion.div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                    background: order.refundStatus === "completed" ? "rgba(34, 197, 94, 0.1)" : "rgba(249, 115, 22, 0.1)",
                    border: `1px solid ${order.refundStatus === "completed" ? "#22c55e" : "#f97316"}`
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p style={{ color: order.refundStatus === "completed" ? "#22c55e" : "#f97316", fontWeight: 600 }}>
                    Refund: {order.refundStatus}
                  </p>
                </motion.div>
              ) : null}

              {order.paymentStatus === "paid" && order.refundStatus === "none" ? (
                <div>
                  {refundOrderId === order._id ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: "1rem" }}>
                      <input
                        placeholder="Enter refund reason..."
                        value={refundReason}
                        onChange={(event) => setRefundReason(event.target.value)}
                        style={{ width: "100%", marginBottom: "0.75rem" }}
                      />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <motion.button onClick={() => requestRefund(order._id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          Submit Request
                        </motion.button>
                        <motion.button className="btn-secondary" onClick={() => setRefundOrderId(null)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button onClick={() => setRefundOrderId(order._id)} style={{ width: "100%" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Request Refund
                    </motion.button>
                  )}
                </div>
              ) : null}
            </motion.article>
          ))
        )}
      </div>
    </section>
  );
}
