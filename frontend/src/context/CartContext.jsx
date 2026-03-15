import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // ✅ ADD TO CART
  const addToCart = (item) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.productId === item.productId &&
          p.size === item.size &&
          JSON.stringify(p.addons) === JSON.stringify(item.addons)
      );

      // 🆕 new item
      if (idx === -1) {
        return [
          ...prev,
          {
            ...item,
            price: Number(item.price) || 0,
            qty: Number(item.qty) || 1,
          },
        ];
      }

      // 🔁 increase qty
      const clone = [...prev];
      clone[idx] = {
        ...clone[idx],
        qty: clone[idx].qty + (item.qty || 1),
      };
      return clone;
    });
  };

  // ✅ INCREASE QTY
  const increaseQty = (index) => {
    setItems((prev) => {
      const clone = [...prev];
      clone[index].qty += 1;
      return clone;
    });
  };

  // ✅ DECREASE QTY
  const decreaseQty = (index) => {
    setItems((prev) => {
      const clone = [...prev];
      if (clone[index].qty > 1) {
        clone[index].qty -= 1;
      }
      return clone;
    });
  };

  const removeItem = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const clearCart = () => setItems([]);

  // ⭐⭐⭐ CRITICAL FIX ⭐⭐⭐
  const subtotal = useMemo(() => {
    return items.reduce(
      (acc, i) => acc + Number(i.price || 0) * Number(i.qty || 0),
      0
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeItem,
        clearCart,
        subtotal,
        increaseQty,
        decreaseQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);