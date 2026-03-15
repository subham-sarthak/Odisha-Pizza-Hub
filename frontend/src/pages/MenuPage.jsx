import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { offerApi, productApi, storeApi } from "../api";
import Bestsellers from "../components/Bestsellers";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useOrderSocket } from "../hooks/useOrderSocket.js";

const serviceCards = [
  {
    title: "24/7 Home Delivery",
    subtitle: "Hot & fresh pizzas",
    discount: "Under 30 minutes"
  },
  {
    title: "Track Your Order",
    subtitle: "Real-time updates",
    discount: "Live order status"
  },
  {
    title: "Premium Quality",
    subtitle: "Fresh ingredients",
    discount: "Handcrafted with care"
  }
];

export default function MenuPage() {
  const { items } = useCart();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeOpen, setStoreOpen] = useState(true);
  const { lastStoreStatusUpdate } = useOrderSocket({ connectWithoutAuth: true });

  // Smooth scroll to menu section
  const handleOrderClick = () => {
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoriesRes, offersRes, productsRes, storeRes] = await Promise.all([
          productApi.categories(),
          offerApi.list(),
          productApi.list({}),
          storeApi.status()
        ]);
        
        setCategories(categoriesRes.data?.data || []);
        setOffers(offersRes.data?.data || []);
        setProducts(productsRes.data?.data || []);
        setStoreOpen(Boolean(storeRes?.data?.data?.isOpen));
      } catch (error) {
        console.error("Error fetching data:", error);
        setCategories([]);
        setOffers([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!lastStoreStatusUpdate) return;
    setStoreOpen(Boolean(lastStoreStatusUpdate.isOpen));
  }, [lastStoreStatusUpdate]);

  const productsByCategory = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (!map.has(p.category)) map.set(p.category, p);
    });
    return map;
  }, [products]);

  const categoryImages = {
    "BURGER": "/image/burger.jpg",
    "DRINKS (MILK SHAKE)": "/image/milkshake.jpg",
    "ICE CREAM": "/image/icecream.jpg",
    "SOFT DRINKS": "/image/softdrinks.jpg",
    "VEG FRIES": "/image/vegfries.jpg"
  };

  return (
    <section className="menu-page" style={{ minHeight: '100vh', background: theme === 'dark' ? '#1a1a1a' : '#f5f3f0' }}>
      {loading && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          fontSize: '24px',
          color: theme === 'dark' ? '#fff' : '#000'
        }}>
          Loading Odisha Pizza Hub...
        </div>
      )}
      {!loading && (
        <>
      {!storeOpen ? (
        <div className="store-closed-overlay">
          🔴 Restaurant is closed. Please come back later.
        </div>
      ) : null}

      <section className="hero-section">
        <div className="container">
          <header className="hero-topbar">
            <div className="hero-brand">
              <span className="logo-badge">OPH</span>
              <h1>Odisha Pizza Hub</h1>
            </div>
            <p className={`hero-store-status ${storeOpen ? "open" : "closed"}`}>
              {storeOpen ? "🟢 Restaurant Open" : "🔴 Restaurant Closed"}
            </p>
            <div className="hero-links">
              <button 
                className="outline-btn" 
                onClick={toggleTheme}
                title="Toggle theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              {!user ? <Link className="solid-btn" to="/auth">Sign in</Link> : <button className="solid-btn" onClick={logout}>Logout</button>}
              <Link className="offer-btn" to="/offers" title="View all offers">🎁 Offers</Link>
              <Link className="cart-mini" to="/cart">🛒 {items.length}</Link>
            </div>
          </header>

          {/* Hero Content with Image */}
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-text">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Delicious Food, Ready for Pickup
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Freshly made pizzas, burgers and more. Experience authentic Odisha flavors crafted with love and premium ingredients.
              </motion.p>
              <button
                onClick={handleOrderClick}
                className="hero-cta"
                type="button"
                disabled={!storeOpen}
                style={!storeOpen ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
              >
                {storeOpen ? "Order Now" : "Restaurant Closed"}
              </button>
              <div className="menu-pdf-actions">
                <button
                  type="button"
                  className="menu-pdf-btn"
                  onClick={() => window.open("/menu/odisha-pizza-hub-menu.pdf", "_blank", "noreferrer")}
                >
                  View Full Menu PDF
                </button>
              </div>
            </div>
            <motion.div
              className="hero-image"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600"
                alt="Delicious Pizza"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Offer Banners */}
      <section className="content-section">
        <motion.div 
          className="offer-carousel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="offer-banners">
            <motion.div 
              className="offer-banner"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <h3>🎉 FLAT 20% OFF</h3>
              <p>On all pizzas. Limited time offer!</p>
              <span className="promo-code">Use: ODISHA20</span>
            </motion.div>
            <motion.div 
              className="offer-banner"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <h3>🍕 Buy 1 Get 1 Free</h3>
              <p>Order any large pizza and get one free!</p>
              <span className="promo-code">Auto Applied</span>
            </motion.div>
            <motion.div 
              className="offer-banner"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <h3>🎁 Free Garlic Bread</h3>
              <p>On orders above ₹499</p>
              <span className="promo-code">No Code Needed</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Modern Category Grid - Swiggy/Zomato Style */}
        <motion.div 
          id="menu-section"
          className="modern-category-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="category-header">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Browse Our Menu
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="category-subtitle"
            >
              Select a section to explore our delicious offerings
            </motion.p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading our delicious menu...</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="modern-category-grid">
              {categories.map((category, index) => {
                const preview = productsByCategory.get(category);
                const imageSrc = categoryImages[category] || preview?.image;
                
                return (
                  <Link 
                    key={category}
                    to={`/category/${encodeURIComponent(category)}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.div
                      className="modern-category-card"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.7 + index * 0.08, 
                        duration: 0.5,
                        ease: "easeOut"
                      }}
                      whileHover={{ 
                        y: -6, 
                        scale: 1.02,
                        transition: { duration: 0.3 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="card-glow"></div>
                      
                      <div className="category-image-wrapper">
                        {imageSrc && (
                          <img 
                            src={imageSrc} 
                            alt={category}
                            className="category-image"
                          />
                        )}
                      </div>
                      
                      <div className="category-info">
                        <h3 className="category-name">{category}</h3>
                        <p className="category-explore">Explore items</p>
                      </div>
                      
                      <div className="category-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path 
                            d="M5 12h14m-7-7l7 7-7 7" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No categories available at the moment</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Top 10 Bestsellers Section */}
      <Bestsellers storeOpen={storeOpen} />

      {offers.length > 0 && (
        <section className="content-section">
          <h3 style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: '"Sora", sans-serif', marginBottom: '1rem' }}>Live Offers</h3>
          <div className="offer-strip">
            {offers.map((offer) => (
              <article key={offer._id} className="offer-card">
                <p className="offer-tag">LIVE OFFER</p>
                <h4>{offer.title}</h4>
                <p>{offer.description}</p>
                <span>{offer.discount}% OFF</span>
              </article>
            ))}
          </div>
        </section>
      )}
      </>
      )}
    </section>
  );
}
