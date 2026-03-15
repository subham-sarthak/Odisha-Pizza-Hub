import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { productApi, storeApi } from "../api";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useOrderSocket } from "../hooks/useOrderSocket.js";

export default function CategoryItemsPage() {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { items } = useCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storeOpen, setStoreOpen] = useState(true);
    const { lastStoreStatusUpdate } = useOrderSocket({ connectWithoutAuth: true });

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const decodedCategory = decodeURIComponent(categoryName);
                const params = { category: decodedCategory };
                const response = await productApi.list(params);
                
                setProducts(response.data.data);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        };

        if (categoryName) {
            fetchProducts();
        }
    }, [categoryName]);

    useEffect(() => {
        storeApi.status().then((res) => setStoreOpen(Boolean(res?.data?.data?.isOpen)));
    }, []);

    useEffect(() => {
        if (!lastStoreStatusUpdate) return;
        setStoreOpen(Boolean(lastStoreStatusUpdate.isOpen));
    }, [lastStoreStatusUpdate]);

    const handleAddToCart = (product) => {
        if (!storeOpen) {
            return;
        }

        const defaultSize = product.sizes?.[0]?.label || "M";
        const sizePrice = product.sizes?.[0]?.price || 0;
        
        addToCart({
            productId: product._id,
            name: product.name,
            image: product.image || product.imageUrl || "",
            price: Number(sizePrice) || 0,
            size: defaultSize,
            addons: [],
            qty: 1,
            lineTotal: sizePrice
        });
    };

    return (
        <section className="category-items-page">
            {!storeOpen ? (
                <div className="store-closed-overlay">
                    🔴 Restaurant is closed. Please come back later.
                </div>
            ) : null}

            {/* Header */}
            <header className="category-header">
                <div className="container">
                    <div className="header-topbar">
                        <div className="header-brand">
                            <span className="logo-badge">OPH</span>
                            <h1>Odisha Pizza Hub</h1>
                        </div>
                        <div className="header-actions">
                            <button
                                className="outline-btn"
                                onClick={toggleTheme}
                                title="Toggle theme"
                            >
                                {theme === "dark" ? "☀️" : "🌙"}
                            </button>
                            <Link to="/menu">Partner with us</Link>
                            {!user ? (
                                <Link className="solid-btn" to="/auth">Sign in</Link>
                            ) : (
                                <button className="solid-btn" onClick={logout}>Logout</button>
                            )}
                            <Link className="cart-mini" to="/cart">🛒 {items.length}</Link>
                        </div>
                    </div>

                    <motion.div
                        className="category-title-section"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <button
                            className="back-btn"
                            onClick={() => navigate("/menu")}
                        >
                            ← Back to Menu
                        </button>
                        <h2>{decodeURIComponent(categoryName)}</h2>
                        <p>Explore our delicious {decodeURIComponent(categoryName).toLowerCase()} items</p>
                    </motion.div>
                </div>
            </header>

            {/* Content */}
            <section className="content-section">
                <div className="container">
                    {loading ? (
                        <motion.div
                            className="loading-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="spinner"></div>
                            <p>Loading delicious items...</p>
                        </motion.div>
                    ) : products.length === 0 ? (
                        <motion.div
                            className="empty-state"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="empty-icon">🍕</div>
                            <h3>No Items Found</h3>
                            <p>Sorry, we don't have any items in this category yet.</p>
                            <button 
                                className="solid-btn"
                                onClick={() => navigate("/menu")}
                            >
                                Browse All Categories
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            <motion.div
                                className="items-grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                {products.map((product, idx) => (
                                    <motion.div
                                        key={product._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    >
                                        <ProductCard
                                            product={product}
                                            onAdd={handleAddToCart}
                                            disabled={!storeOpen}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </>
                    )}
                </div>
            </section>


        </section>
    );
}
