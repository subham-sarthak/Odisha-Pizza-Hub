import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { bestsellers } from "../data/bestsellers";

export default function Bestsellers({ storeOpen = true }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (item) => {
    if (!storeOpen) return;

    addToCart({
      productId: item.id,
      name: item.name,
      price: Number(item.price), // ✅ ALWAYS NUMBER
      image: item.image,
      qty: 1,
      size: "S",
      addons: [],
    });

    setTimeout(() => {
      navigate("/cart");
    }, 200);
  };

  if (!bestsellers?.length) return null;

  return (
    <section className="bestsellers-section">
      <div className="bestsellers-container">
        <motion.div
          className="bestsellers-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="crown-icon">👑</div>
          <h2 className="bestsellers-title">Top 10 Bestsellers</h2>
          <p className="bestsellers-subtitle">📍 In Your Locality</p>
        </motion.div>

        <div className="bestsellers-scroll-container">
          {bestsellers.map((item) => (
            <div key={item.id} className="bestseller-card">
              <div className="card-image-wrapper">
                <img className="card-image" src={item.image} alt={item.name} />
              </div>

              <div className="card-content">
                <h3 className="card-title">{item.name}</h3>
                <p className="card-description">{item.description}</p>

                <div className="card-footer">
                  <span className="price">₹{item.price}</span>

                  <button
                    className="add-btn"
                    onClick={() => handleAddToCart(item)}
                    disabled={!storeOpen}
                    title={!storeOpen ? "Restaurant is closed. Please come back later." : "Add to cart"}
                    aria-label={!storeOpen ? "Restaurant is closed. Please come back later." : `Add ${item.name} to cart`}
                    style={!storeOpen ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
                  >
                    {storeOpen ? "Add +" : "🔒 Closed"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}