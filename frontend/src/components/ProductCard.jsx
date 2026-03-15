import { motion } from "framer-motion";

export default function ProductCard({ product, onAdd, disabled = false }) {
  const startPrice = Math.min(...product.sizes.map((s) => s.price));
  const eta = `${12 + Math.floor(Math.random() * 18)} min`;
  const rating = (4 + Math.random()).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="product-card"
    >
      <div className="product-media">
        <img src={product.image} alt={product.name} />
        <p className="eta-chip">⏱️ {eta}</p>
      </div>
      <div className="product-body">
        <div className="card-top">
          <p className={`badge ${product.type === 'veg' ? 'veg' : 'nonveg'}`}>
            {product.type === 'veg' ? 'VEG' : 'NONVEG'}
          </p>
          <p className="rating">{rating}</p>
        </div>
        <h3>{product.name}</h3>
        <p>{product.category}</p>
        <div className="card-bottom">
          <p>₹{startPrice}</p>
          <motion.button 
            onClick={() => onAdd(product)}
            disabled={disabled}
            title={disabled ? "Restaurant is closed. Please come back later." : "Add to cart"}
            aria-label={disabled ? "Restaurant is closed. Please come back later." : `Add ${product.name} to cart`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={disabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            {disabled ? "🔒 Closed" : "Add +"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
