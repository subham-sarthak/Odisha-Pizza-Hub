import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi, storeApi } from "../api";
import { useCart } from "../context/CartContext";
import { useOrderSocket } from "../hooks/useOrderSocket.js";

export default function CartPage() {
  const navigate = useNavigate();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderError, setOrderError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [pickupTime, setPickupTime] = useState("ASAP");
  const [storeOpen, setStoreOpen] = useState(true);
  const { lastStoreStatusUpdate } = useOrderSocket();

  const {
    items,
    increaseQty,
    decreaseQty,
    removeItem,
    clearCart,
    subtotal,
  } = useCart();

  useEffect(() => {
    storeApi.status().then((res) => setStoreOpen(Boolean(res?.data?.data?.isOpen)));
  }, []);

  useEffect(() => {
    if (!lastStoreStatusUpdate) return;
    setStoreOpen(Boolean(lastStoreStatusUpdate.isOpen));
  }, [lastStoreStatusUpdate]);

  const handlePlaceOrder = async () => {
    if (!items.length) {
      setOrderError("Your cart is empty.");
      setOrderMessage("");
      return;
    }

    if (!storeOpen) {
      setOrderError("Store is currently closed. Please try again later.");
      setOrderMessage("");
      return;
    }

    setPlacingOrder(true);
    setOrderError("");
    setOrderMessage("");

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          size: item.size || "S",
          qty: Number(item.qty || 1),
          addons: Array.isArray(item.addons) ? item.addons : []
        })),
        paymentMethod,
        pickupTime,
        tableBooking: null,
        couponCode: null,
        rewardToRedeem: 0
      };

      const { data } = await orderApi.create(payload);
      const tokenNumber = data?.data?.tokenNumber;
      setOrderMessage(tokenNumber ? `Order placed. Token #${tokenNumber}` : "Order placed successfully.");
      clearCart();
      navigate("/orders");
    } catch (error) {
      setOrderError(error.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="cart-page">
      <h1 className="cart-title">🛒 Your Cart</h1>
      <p className="cart-subtitle">
        Review your order and proceed to checkout
      </p>

      <div className="cart-layout">
        <div className="cart-items">
          {items.length === 0 && (
            <p className="cart-empty">Your cart is empty</p>
          )}

          {items.map((item, index) => (
            <div key={index} className="cart-item-card">
              <img
                src={item.image || "/image/burger.jpg"}
                alt={item.name}
                className="cart-item-img"
              />

              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p>Size: {item.size || "S"}</p>

                {/* ✅ FIXED PRICE CALCULATION */}
                <p className="item-price">
                  ₹{Number(item.price || 0) * Number(item.qty || 0)}
                </p>
              </div>

              {/* RIGHT CONTROLS */}
              <div className="cart-controls">
                <div className="qty-controls">
                  {/* ✅ MINUS */}
                  <button
                    className="qty-btn"
                    onClick={() => decreaseQty(index)}
                  >
                    −
                  </button>

                  <span className="qty-number">{item.qty}</span>

                  {/* ✅ PLUS */}
                  <button
                    className="qty-btn"
                    onClick={() => increaseQty(index)}
                  >
                    +
                  </button>
                </div>

                {/* ✅ REMOVE */}
                <button
                  className="remove-btn"
                  onClick={() => removeItem(index)}
                >
                  🗑 Remove
                </button>
              </div>
            </div>
          ))}

          {/* OFFERS */}
          <div className="offers-box">
            <h3 className="offers-title">💰 Available Offers</h3>
            <div className="offer-tags">
              <span className="offer-chip">ODISHA20 • 20% OFF</span>
              <span className="offer-chip">PIZZA10 • 10% OFF</span>
            </div>
          </div>
        </div>

        <div className="order-summary">
          <h2 className="summary-title">📋 Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="summary-row">
            <span>Coupon Discount</span>
            <span className="discount-value">−₹0</span>
          </div>

          <div className="summary-row">
            <span>Reward Points</span>
            <span className="discount-value">−₹0</span>
          </div>

          <hr />

          <div className="checkout-options">
            <div className="checkout-field">
              <label htmlFor="payment-method">Payment Method</label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cod">Cash On Delivery</option>
                <option value="online">Online Payment</option>
              </select>
            </div>

            <div className="checkout-field">
              <label htmlFor="pickup-time">Pickup Time</label>
              <select
                id="pickup-time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              >
                <option value="ASAP">As Soon As Possible</option>
                <option value="In 15 minutes">In 15 minutes</option>
                <option value="In 30 minutes">In 30 minutes</option>
                <option value="In 45 minutes">In 45 minutes</option>
              </select>
            </div>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <span className="total-amount">₹{subtotal}</span>
          </div>

          <button className="place-order-btn" onClick={handlePlaceOrder} disabled={placingOrder || !storeOpen}>
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>
          {!storeOpen ? <p style={{ color: "#ef4444", marginTop: "0.75rem" }}>🔴 Restaurant is closed. Ordering is disabled.</p> : null}
          {orderError ? <p style={{ color: "#ef4444", marginTop: "0.75rem" }}>{orderError}</p> : null}
          {orderMessage ? <p style={{ color: "#22c55e", marginTop: "0.75rem" }}>{orderMessage}</p> : null}
        </div>
      </div>
    </div>
  );
}