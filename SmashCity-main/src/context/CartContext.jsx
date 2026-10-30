import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi, ordersApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Coupon state
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Sync cart from backend
  const fetchCart = useCallback(async () => {
    try {
      const data = await cartApi.getCart();
      if (data.cart_key) {
        localStorage.setItem('smashcity_guest_cart_key', data.cart_key);
      }
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.warn('Could not load cart from backend:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Subtotal calculation (from server cart items)
  const subtotal = items.reduce((acc, item) => {
    const price = parseFloat(item.product?.price || 0);
    return acc + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Delivery fee: $2.50 or Free if subtotal >= 30.00
  const deliveryFee = subtotal >= 30.0 || items.length === 0 ? 0.0 : 2.5;

  // Coupon discount calculation
  let discountAmount = 0.0;
  if (coupon && subtotal > 0) {
    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (subtotal * parseFloat(coupon.value)) / 100.0;
    } else {
      discountAmount = parseFloat(coupon.value);
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Cart operations
  const addToCart = async (product, quantity = 1) => {
    setLoading(true);
    try {
      const res = await cartApi.addItem(product.id, quantity);
      if (res.items) {
        setItems(res.items);
      } else {
        await fetchCart();
      }
      setIsCartOpen(true);
    } catch (err) {
      console.error('Failed to add item to cart:', err.message);
      // Fallback local update if network hiccups
      setItems((prev) => {
        const existing = prev.find((i) => i.product?.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product?.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [...prev, { id: Date.now(), product, quantity }];
      });
      setIsCartOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(itemId);
    }
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
    try {
      const res = await cartApi.updateItem(itemId, quantity);
      if (res.items) setItems(res.items);
    } catch (err) {
      console.error('Failed to update quantity:', err.message);
      fetchCart();
    }
  };

  const removeFromCart = async (itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      const res = await cartApi.removeItem(itemId);
      if (res.items) setItems(res.items);
    } catch (err) {
      console.error('Failed to remove item:', err.message);
      fetchCart();
    }
  };

  const clearCart = async () => {
    setItems([]);
    setCoupon(null);
    try {
      await cartApi.clearCart();
    } catch (err) {
      console.warn('Failed to clear cart:', err.message);
    }
  };

  const applyCoupon = async (code) => {
    if (!code || !code.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await ordersApi.validateCoupon(code.trim().toUpperCase(), subtotal.toFixed(2));
      if (res.valid) {
        setCoupon({
          code: res.code,
          discount_type: res.discount_type,
          value: res.value,
          message: res.message,
        });
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
      setCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryFee,
        discountAmount,
        finalTotal,
        loading,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        isCheckoutOpen,
        openCheckout: () => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        },
        closeCheckout: () => setIsCheckoutOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        coupon,
        couponError,
        couponLoading,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
