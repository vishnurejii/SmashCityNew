import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartDrawer = () => {
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    discountAmount,
    finalTotal,
    isCartOpen,
    closeCart,
    openCheckout,
    updateQuantity,
    removeFromCart,
    clearCart,
    coupon,
    couponError,
    couponLoading,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
      setCouponInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={closeCart}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" 
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#141414] border-l-2 border-[#262626] text-white flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-accent" />
              <h2 className="text-3xl font-chunky tracking-wider text-white">
                YOUR SMASH BAG <span className="text-accent text-xl">({itemCount})</span>
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close cart"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-surface-hover border border-border flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-2xl font-chunky tracking-wide text-white">YOUR BAG IS EMPTY</h3>
                <p className="font-['Caveat'] text-gray-400 text-xl font-bold max-w-xs">
                  Crispy edges and juicy centers are waiting. Add your favorite smash burger to get started!
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    const menuEl = document.getElementById('menu');
                    if (menuEl) menuEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 px-6 py-3 bg-accent text-black font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition-colors"
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              items.map((item) => {
                const product = item.product || {};
                const itemPrice = parseFloat(product.price || 0);
                const itemTotal = (itemPrice * item.quantity).toFixed(2);

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-[#0A0A0A] rounded-xl border border-border/80 group hover:border-accent/40 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border bg-[#141414]">
                      <img
                        src={product.effective_image_url || product.image || product.image_url || '/burger-1.webp'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-['Caveat'] text-2xl font-bold text-white leading-tight">
                            {product.name}
                          </h4>
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                            {product.type_label || 'Burger'}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity & Item Total */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border rounded bg-surface">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:text-accent transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold font-mono text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:text-accent transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="font-display text-lg text-accent tracking-wider">
                          ${itemTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-border bg-[#0E0E0E] space-y-4">
              
              {/* Coupon Section */}
              {coupon ? (
                <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-accent" />
                    <div>
                      <span className="text-xs font-bold text-accent uppercase tracking-wider">{coupon.code}</span>
                      <p className="text-[11px] text-gray-300 font-medium">
                        {coupon.discount_type === 'PERCENTAGE' ? `${coupon.value}% Discount` : `$${coupon.value} Discount`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-widest"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code (e.g. SMASH10)"
                      className="w-full bg-[#141414] border border-border rounded-lg pl-9 pr-3 py-2 text-xs uppercase font-mono text-white placeholder-gray-500 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-4 py-2 bg-[#222] hover:bg-accent hover:text-black text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-border disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-red-400 font-medium">{couponError}</p>
              )}

              {/* Subtotal & Breakdown */}
              <div className="space-y-2 text-xs font-medium text-gray-300 pt-2 border-t border-border/50">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-white font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-white font-bold">
                    {deliveryFee === 0 ? (
                      <span className="text-green-400 uppercase font-bold">FREE</span>
                    ) : (
                      `$${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-accent font-bold">
                    <span>Discount</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-border text-base">
                  <span className="font-display text-lg uppercase tracking-wider text-white">Total</span>
                  <span className="font-display text-2xl text-accent tracking-wider font-bold">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={openCheckout}
                className="w-full bg-accent text-black font-bold uppercase tracking-widest py-3.5 rounded-lg hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
