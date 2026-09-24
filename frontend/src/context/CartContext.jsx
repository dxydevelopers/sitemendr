import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "azardstores_cart";

// A cart line is uniquely identified by product + variant (not just product),
// so two variants of the same product sit as separate lines. Products with
// no variant selected use variantId: null, same as before this existed.
function sameLine(item, productId, variantId) {
  return item.productId === productId && (item.variantId || null) === (variantId || null);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // `variant`, when provided, is the selected variant subdocument
  // ({ _id, name, price, stock, image, ... }) — its own price/image
  // override the product's if set, matching how the backend prices it.
  function addItem(product, quantity = 1, variant = null) {
    const variantId = variant?._id || null;
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, product._id, variantId));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, product._id, variantId) ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          variantId,
          variantName: variant?.name || "",
          name: product.name,
          price: variant?.price ?? product.price,
          image: variant?.image || product.images?.[0] || "",
          quantity,
        },
      ];
    });
  }

  function removeItem(productId, variantId = null) {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, variantId)));
  }

  function updateQuantity(productId, quantity, variantId = null) {
    if (quantity < 1) return removeItem(productId, variantId);
    setItems((prev) =>
      prev.map((i) => (sameLine(i, productId, variantId) ? { ...i, quantity } : i))
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
