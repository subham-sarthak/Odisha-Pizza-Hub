import { NavLink } from "react-router-dom";
import "./sidebar.css";

const navItems = [
    { label: "Home", to: "/menu" },
    { label: "Menu", to: "/menu" },
    { label: "Order History", to: "/order-history" },
    { label: "My Account", to: "/auth" },
];

const socialItems = [
    { label: "Facebook", short: "f", href: "#" },
    { label: "Twitter", short: "t", href: "#" },
    { label: "Google+", short: "g+", href: "#" },
    { label: "LinkedIn", short: "in", href: "#" },
];

export default function Sidebar() {
    const handleSendMessage = () => {
        const phoneNumber = "919777819795";
        const text = encodeURIComponent("Hi Odisha Pizza Hub, I would like to place an order.");
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <aside className="restaurant-sidebar">
            <div className="sidebar-top">
                <div className="sidebar-brand">
                    <div className="sidebar-logo">🍕</div>
                    <div>
                        <p className="sidebar-brand-name">Odisha Pizza Hub</p>
                        <p className="sidebar-brand-tag">Classic Restaurant</p>
                    </div>
                </div>

                <nav className="sidebar-nav" aria-label="Sidebar Navigation">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) =>
                                isActive ? "sidebar-link active" : "sidebar-link"
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <button className="order-online-btn" type="button">
                    Order Online
                </button>
            </div>

            <div className="sidebar-bottom">
                <section className="sidebar-contact" aria-label="Contact information">
                    <h3>Location & Contact</h3>
                    <p>📍3GF5+54C,3433,By Pass,Near Cosmo Bazar, Bankashi-Bhadrak, Odisha</p>
                    {/* <p>🌐 www.odishapizza.com</p> */}
                    <p>📞 +91 9777819195</p>
                    <button className="send-email-btn" type="button" onClick={handleSendMessage}>
                        Send Message
                    </button>
                </section>

                <section className="sidebar-social" aria-label="Social media links">
                    {socialItems.map((item) => (
                        <a key={item.label} href={item.href} aria-label={item.label}>
                            {item.short}
                        </a>
                    ))}
                </section>

                <section className="working-hours" aria-label="Working Hours">
                    <h3>Opening Time</h3>
                    <div className="hours-row">
                        <span>Mon – Fri</span>
                        <span>09:00AM – 10:00PM</span>
                    </div>
                    <div className="hours-row">
                        <span>Sat &amp; Sun</span>
                        <span>09:00AM – 11:00PM</span>
                    </div>
                </section>
            </div>
        </aside>
    );
}