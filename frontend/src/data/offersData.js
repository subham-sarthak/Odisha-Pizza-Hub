export const offersData = [
  {
    id: 1,
    code: "ODISHA40",
    discount: "40",
    discountType: "percentage",
    title: "Flat 40% OFF",
    description: "Get amazing pizza and delicious food at unbeatable prices",
    minOrder: 299,
    maxDiscount: 150,
    tag: "Popular",
    urgency: "Ends Tonight",
    expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    category: "All"
  },
  {
    id: 2,
    code: "PIZZA10",
    discount: "₹100",
    discountType: "flat",
    title: "Flat ₹100 OFF",
    description: "On minimum order of ₹199. Valid on all pizzas only",
    minOrder: 199,
    maxDiscount: 100,
    tag: "Limited",
    urgency: "Limited Offer",
    expiryDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
    category: "Pizza Offers"
  },
  {
    id: 3,
    code: "COMBO50",
    discount: "50",
    discountType: "percentage",
    title: "Flat 50% OFF on Combos",
    description: "Order any combo and enjoy massive savings this weekend",
    minOrder: 399,
    maxDiscount: 200,
    tag: "Popular",
    urgency: "Weekend Special",
    expiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    category: "Combo Deals"
  },
  {
    id: 4,
    code: "BANK20",
    discount: "₹50",
    discountType: "flat",
    title: "Bank Offer - ₹50 OFF",
    description: "On HDFC Credit/Debit Card. Minimum order ₹249",
    minOrder: 249,
    maxDiscount: 50,
    tag: "Bank Offer",
    urgency: "Bank Special",
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    category: "Bank Offers"
  },
  {
    id: 5,
    code: "FIRST30",
    discount: "30",
    discountType: "percentage",
    title: "Welcome - 30% OFF",
    description: "First order discount for new users. Valid up to ₹100 off",
    minOrder: 199,
    maxDiscount: 100,
    tag: "New User",
    urgency: "First Order",
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    category: "All"
  },
  {
    id: 6,
    code: "PIZZA5",
    discount: "₹75",
    discountType: "flat",
    title: "Flat ₹75 OFF",
    description: "Perfect for lunch orders on all pizza combos",
    minOrder: 229,
    maxDiscount: 75,
    tag: null,
    urgency: "Lunch Special",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    category: "Pizza Offers"
  }
];

export const offerTabs = [
  { name: "All Offers", category: "All" },
  { name: "Pizza Offers", category: "Pizza Offers" },
  { name: "Combo Deals", category: "Combo Deals" },
  { name: "Bank Offers", category: "Bank Offers" }
];
