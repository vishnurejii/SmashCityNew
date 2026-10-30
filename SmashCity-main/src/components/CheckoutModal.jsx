import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, MapPin, Phone, User, FileText, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi, paymentsApi, authApi } from '../services/api';

const CheckoutModal = () => {
  const {
    items,
    subtotal,
    deliveryFee,
    discountAmount,
    finalTotal,
    isCheckoutOpen,
    closeCheckout,
    clearCart,
    coupon,
  } = useCart();

  const { user, isAuthenticated, openTracking } = useAuth();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    city: 'Downtown',
    state: 'NY',
    postal_code: '10001',
    delivery_instructions: '',
    payment_method: 'COD', // 'COD' or 'RAZORPAY'
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idempotencyKey] = useState(() => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Fill default values from user profile when modal opens
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        customer_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '',
        customer_email: user.email || '',
        customer_phone: user.phone_number || '',
      }));

      // Fetch saved addresses
      authApi.getAddresses().then((addrs) => {
        if (Array.isArray(addrs) && addrs.length > 0) {
          setSavedAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setFormData((prev) => ({
              ...prev,
              delivery_address: defaultAddr.street_address,
              city: defaultAddr.city,
              state: defaultAddr.state || '',
              postal_code: defaultAddr.postal_code,
              delivery_instructions: defaultAddr.delivery_instructions || '',
              customer_phone: defaultAddr.phone_number || prev.customer_phone,
            }));
          }
        }
      }).catch(() => {});
    }
  }, [user, isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const handleAddressSelect = (addrId) => {
    setSelectedAddressId(addrId);
    if (!addrId) return;
    const addr = savedAddresses.find((a) => a.id === parseInt(addrId));
    if (addr) {
      setFormData((prev) => ({
        ...prev,
        delivery_address: addr.street_address,
        city: addr.city,
        state: addr.state || '',
        postal_code: addr.postal_code,
        delivery_instructions: addr.delivery_instructions || prev.delivery_instructions,
        customer_phone: addr.phone_number || prev.customer_phone,
      }));
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customer_name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!formData.customer_phone.trim()) {
      setError('Please provide a contact phone number.');
      return;
    }
    if (!formData.delivery_address.trim()) {
      setError('Please provide a delivery street address.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Order on Django backend
      const orderPayload = {
        ...formData,
        coupon_code: coupon ? coupon.code : '',
        idempotency_key: idempotencyKey,
      };

      const createdOrder = await ordersApi.createOrder(orderPayload);
      const orderNumber = createdOrder.order_number;

      // 2. Handle Payment
      if (formData.payment_method === 'COD') {
        // Cash on delivery: complete immediately
        await clearCart();
        closeCheckout();
        openTracking(orderNumber);
      } else {
        // Online Payment via Razorpay
        try {
          const payData = await paymentsApi.createRazorpayOrder(orderNumber);
          
          // Check if Razorpay script exists on window
          if (window.Razorpay && !payData.is_test_mode) {
            const options = {
              key: payData.key_id,
              amount: payData.amount,
              currency: payData.currency,
              name: 'SmashCity',
              description: `Order ${orderNumber}`,
              image: '/favicon.svg',
              order_id: payData.razorpay_order_id,
              handler: async function (response) {
                try {
                  await paymentsApi.verifyPayment({
                    order_number: orderNumber,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  await clearCart();
                  closeCheckout();
                  openTracking(orderNumber);
                } catch (verifyErr) {
                  setError('Payment verification failed. Please contact support with order #' + orderNumber);
                }
              },
              prefill: {
                name: formData.customer_name,
                email: formData.customer_email,
                contact: formData.customer_phone,
              },
              theme: {
                color: '#FFD700',
              },
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
              setError(`Payment failed: ${resp.error.description}`);
            });
            rzp.open();
          } else {
            // Test Mode Simulation Flow (safe and clearly identified)
            const confirmTestPay = window.confirm(
              `[Razorpay Gateway - Test Mode]\n\nSimulate successful payment for Order ${orderNumber} ($${createdOrder.total_amount})?`
            );

            if (confirmTestPay) {
              await paymentsApi.verifyPayment({
                order_number: orderNumber,
                razorpay_order_id: payData.razorpay_order_id,
                razorpay_payment_id: `pay_test_${Date.now()}`,
                razorpay_signature: `test_sig_${orderNumber}`,
              });
              await clearCart();
              closeCheckout();
              openTracking(orderNumber);
            } else {
              setError('Payment was cancelled by the user. You can retry anytime.');
            }
          }
        } catch (payErr) {
          setError(payErr.message || 'Payment initiation failed. Please try again.');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please review your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#141414] border-2 border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl my-8 text-white max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 50px rgba(255, 215, 0, 0.15)' }}
      >
        {/* Close Button */}
        <button
          onClick={closeCheckout}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
          aria-label="Close checkout"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Checkout</span>
          <h2 className="text-3xl sm:text-4xl font-chunky tracking-wide text-white mt-1">
            DELIVERY & PAYMENT
          </h2>
          <p className="font-['Caveat'] text-gray-400 text-xl font-bold mt-1">
            Fresh burgers straight off the grill to your doorstep.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-200 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="space-y-6">
          
          {/* Saved Addresses for Authenticated Users */}
          {savedAddresses.length > 0 && (
            <div className="p-4 bg-[#0A0A0A] rounded-xl border border-border">
              <label className="block text-xs font-bold text-accent uppercase tracking-wider mb-2">
                Use Saved Delivery Address
              </label>
              <select
                value={selectedAddressId}
                onChange={(e) => handleAddressSelect(e.target.value)}
                className="w-full bg-[#141414] border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
              >
                <option value="">-- Enter a new delivery address --</option>
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.full_name}: {addr.street_address}, {addr.city} {addr.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Details */}
          <div>
            <h3 className="text-lg font-display text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-accent" /> 1. Customer Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  required
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Alex Smash"
                  className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  required
                  value={formData.customer_phone}
                  onChange={handleChange}
                  placeholder="+1 555-0199"
                  className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Email Address (for order receipts)
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h3 className="text-lg font-display text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" /> 2. Delivery Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Street Address & Apartment / Unit *
                </label>
                <input
                  type="text"
                  name="delivery_address"
                  required
                  value={formData.delivery_address}
                  onChange={handleChange}
                  placeholder="404 Smash Avenue, Apt 4B"
                  className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    required
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Delivery Instructions (optional)
                </label>
                <input
                  type="text"
                  name="delivery_instructions"
                  value={formData.delivery_instructions}
                  onChange={handleChange}
                  placeholder="Gate code, leave at door, call on arrival, etc."
                  className="w-full bg-[#0A0A0A] border border-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="text-lg font-display text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" /> 3. Payment Method
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              
              <label 
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  formData.payment_method === 'COD' 
                    ? 'border-accent bg-accent/10 shadow-lg' 
                    : 'border-border bg-[#0A0A0A] hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="COD"
                  checked={formData.payment_method === 'COD'}
                  onChange={handleChange}
                  className="mt-1 accent-[#FFD700]"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-white uppercase tracking-wider">
                    <Banknote className="w-4 h-4 text-accent" />
                    Cash on Delivery
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Pay with cash when your hot smash burger reaches your door.
                  </p>
                </div>
              </label>

              <label 
                className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  formData.payment_method === 'RAZORPAY' 
                    ? 'border-accent bg-accent/10 shadow-lg' 
                    : 'border-border bg-[#0A0A0A] hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="RAZORPAY"
                  checked={formData.payment_method === 'RAZORPAY'}
                  onChange={handleChange}
                  className="mt-1 accent-[#FFD700]"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-white uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-accent" />
                    Razorpay Online
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Instant secure payment via UPI, Debit/Credit Card, or NetBanking.
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* Order Summary Recap */}
          <div className="p-4 bg-[#0A0A0A] rounded-xl border border-border space-y-2">
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Order Summary</h4>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
              <span className="font-mono text-white font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Delivery Fee</span>
              <span className="font-mono text-white font-bold">
                {deliveryFee === 0 ? <span className="text-green-400 font-bold">FREE</span> : `$${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-accent font-bold">
                <span>Discount ({coupon?.code})</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-border/80">
              <span className="font-display text-base uppercase tracking-wider text-white">Final Amount</span>
              <span className="font-display text-2xl text-accent font-bold">${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-all duration-300 shadow-xl disabled:opacity-50 text-base"
          >
            {loading ? 'Processing Order...' : `Confirm & Place Order ($${finalTotal.toFixed(2)})`}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-accent" /> 256-Bit SSL Encrypted & Verified Server-Side Totals
          </div>
        </form>

      </div>
    </div>
  );
};

export default CheckoutModal;
