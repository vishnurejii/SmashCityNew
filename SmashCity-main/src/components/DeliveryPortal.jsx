import React, { useState, useEffect, useRef } from 'react';
import {
  Bike,
  Package,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Navigation,
  DollarSign,
  Clock,
  ExternalLink,
  Store,
  Shield,
  User,
  X,
  ChevronRight
} from 'lucide-react';
import { deliveryApi, ordersApi } from '../services/api';

const DeliveryPortal = ({ onNavigate }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'ready', 'completed', 'all'
  
  // Rider profile info stored locally
  const [riderName, setRiderName] = useState(() => localStorage.getItem('smashcity_rider_name') || 'Alex Swift');
  const [riderPhone, setRiderPhone] = useState(() => localStorage.getItem('smashcity_rider_phone') || '+1 555-8391');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // OTP Verification Modal state
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Action loading state per order
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await deliveryApi.getDeliveryOrders();
      setOrders(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load delivery orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const saveRiderProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('smashcity_rider_name', riderName);
    localStorage.setItem('smashcity_rider_phone', riderPhone);
    setIsEditingProfile(false);
  };

  // Accept / Pick Up Order
  const handlePickupOrder = async (order) => {
    setProcessingOrderId(order.order_number);
    try {
      await deliveryApi.pickupOrder(order.order_number, {
        rider_name: riderName,
        rider_phone: riderPhone,
      });
      await fetchOrders(true);
    } catch (err) {
      alert(err.message || 'Failed to accept order for delivery');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Open OTP Modal for an Out for Delivery order
  const openOtpModal = (order) => {
    setOtpModalOrder(order);
    setOtpDigits(['', '', '', '']);
    setOtpError('');
    setOtpSuccess('');
    setTimeout(() => {
      if (inputRefs[0]?.current) {
        inputRefs[0].current.focus();
      }
    }, 150);
  };

  const handleOtpChange = (index, value) => {
    // allow single character only
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setOtpError('');

    // Auto advance
    if (cleanVal && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 4) {
      setOtpError('Please enter the complete 4-digit OTP provided by the customer.');
      return;
    }

    setSubmittingOtp(true);
    setOtpError('');
    try {
      const res = await deliveryApi.verifyDeliveryOtp(otpModalOrder.order_number, enteredOtp, {
        rider_name: riderName,
        rider_phone: riderPhone,
      });
      setOtpSuccess(res.message || 'Delivery successfully confirmed and verified!');
      // Refresh after short delay
      setTimeout(async () => {
        setOtpModalOrder(null);
        await fetchOrders(true);
      }, 1500);
    } catch (err) {
      setOtpError(err.message || 'Incorrect OTP. Please ask the customer to check their SmashCity tracking screen.');
    } finally {
      setSubmittingOtp(false);
    }
  };

  // Filter orders based on active tab
  const activeOrders = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY');
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

  let displayedOrders = [];
  if (activeTab === 'active') {
    displayedOrders = orders.filter((o) => ['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(o.status));
  } else if (activeTab === 'ready') {
    displayedOrders = readyOrders;
  } else if (activeTab === 'completed') {
    displayedOrders = completedOrders;
  } else {
    displayedOrders = orders;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col font-sans">
      {/* Top Delivery Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-[#222] px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-black font-black flex items-center justify-center shadow-lg shadow-accent/20">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-chunky text-xl tracking-wider text-white">
                  SMASH<span className="text-accent">CITY</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-accent/20 text-accent border border-accent/40 rounded">
                  Rider Portal
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Courier Dispatch & OTP Delivery Handoff</p>
            </div>
          </div>

          {/* Rider Profile & Switch Buttons */}
          <div className="flex items-center gap-3">
            {/* Rider Identity Card */}
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-[#333] hover:border-accent text-xs transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent border border-accent/40 flex items-center justify-center font-bold text-xs">
                {riderName[0]?.toUpperCase() || 'R'}
              </div>
              <div className="text-left">
                <span className="font-bold text-white block leading-tight">{riderName}</span>
                <span className="text-[10px] text-gray-400 font-mono">{riderPhone}</span>
              </div>
            </button>

            {/* Storefront Link */}
            <button
              onClick={() => onNavigate('store')}
              className="p-2 rounded-xl bg-[#1c1c1c] border border-[#333] hover:border-accent text-gray-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              title="Return to Customer Storefront"
            >
              <Store className="w-4 h-4 text-accent" />
            </button>
          </div>
        </div>

        {/* Edit Rider Profile Mini Drawer */}
        {isEditingProfile && (
          <form
            onSubmit={saveRiderProfile}
            className="max-w-5xl mx-auto mt-3 pt-3 border-t border-[#222] flex flex-wrap items-center gap-3 text-xs animate-in fade-in"
          >
            <span className="text-gray-400 font-bold uppercase tracking-wider">Rider Profile:</span>
            <input
              type="text"
              required
              placeholder="Your Name"
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              className="px-3 py-1.5 bg-[#181818] border border-border rounded text-white"
            />
            <input
              type="tel"
              placeholder="Your Phone Number"
              value={riderPhone}
              onChange={(e) => setRiderPhone(e.target.value)}
              className="px-3 py-1.5 bg-[#181818] border border-border rounded text-white"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-accent text-black font-bold uppercase rounded hover:bg-white transition-colors"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        )}
      </header>

      {/* Main Delivery View */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Rider KPI Summary */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
              On the Road
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-accent mt-1 block">
              {activeOrders.length}
            </span>
          </div>

          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
              Ready at Grill
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-purple-400 mt-1 block">
              {readyOrders.length}
            </span>
          </div>

          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 block">
              Completed
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-green-400 mt-1 block">
              {completedOrders.length}
            </span>
          </div>
        </section>

        {/* Tab Selection Navigation */}
        <div className="flex items-center justify-between gap-3 bg-[#121212] p-1.5 rounded-2xl border border-[#222]">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'active'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Active Deliveries ({activeOrders.length + readyOrders.length})
            </button>

            <button
              onClick={() => setActiveTab('ready')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'ready'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Ready for Pickup ({readyOrders.length})
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'completed'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Completed ({completedOrders.length})
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-accent text-black shadow-md shadow-accent/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({orders.length})
            </button>
          </div>

          <button
            onClick={() => fetchOrders(false)}
            disabled={loading || refreshing}
            className="p-2 text-gray-400 hover:text-accent rounded-xl hover:bg-[#1a1a1a] transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>

        {/* Orders List */}
        {loading && orders.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#121212] rounded-2xl border border-[#222]">
            <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Connecting to Rider Dispatch...
            </p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-[#121212] rounded-2xl border border-[#222] p-6">
            <Package className="w-12 h-12 text-gray-600 mx-auto" />
            <h4 className="text-base font-bold text-gray-300">No deliveries in this section</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              New deliveries will appear automatically as the kitchen grills and packages orders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const isProcessing = processingOrderId === order.order_number;
              const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
              const isReadyForPickup = order.status === 'READY_FOR_PICKUP';
              const isDelivered = order.status === 'DELIVERED';
              const isCod = order.payment_method === 'COD';

              return (
                <div
                  key={order.id}
                  className={`bg-[#141414] border-2 rounded-2xl p-5 sm:p-6 transition-all shadow-xl space-y-4 ${
                    isOutForDelivery
                      ? 'border-accent/80 shadow-accent/5'
                      : isReadyForPickup
                      ? 'border-purple-500/40'
                      : isDelivered
                      ? 'border-green-500/30 opacity-80'
                      : 'border-[#262626]'
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242424]">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-lg font-black text-white tracking-wider">
                          {order.order_number}
                        </span>
                        {isOutForDelivery && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/50 flex items-center gap-1.5 animate-pulse">
                            <Bike className="w-3 h-3" />
                            Out For Delivery
                          </span>
                        )}
                        {isReadyForPickup && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Ready at Kitchen
                          </span>
                        )}
                        {isDelivered && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Delivered
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono mt-0.5 block">
                        Estimated ETA: {new Date(order.estimated_delivery_time || order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Payment Alert Banner */}
                    <div className="text-right">
                      {isCod ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-500/50 rounded-xl text-amber-300 text-xs font-bold">
                          <DollarSign className="w-4 h-4 text-amber-400" />
                          <span>COLLECT CASH: <strong>${order.total_amount}</strong></span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-950/40 border border-green-500/40 rounded-xl text-green-300 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          <span>ALREADY PAID ONLINE (${order.total_amount})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information & One-Touch Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Contact */}
                    <div className="p-3.5 bg-[#0a0a0a] rounded-xl border border-[#222] space-y-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Customer Info
                      </span>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{order.customer_name}</p>
                          <p className="text-gray-400 font-mono">{order.customer_phone}</p>
                        </div>

                        {order.customer_phone && (
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-md shadow-green-600/20"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Address & GPS Maps Navigation */}
                    <div className="p-3.5 bg-[#0a0a0a] rounded-xl border border-[#222] space-y-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Delivery Address
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-200">{order.delivery_address}</p>
                          <p className="text-gray-400">{order.city} {order.postal_code}</p>
                          {order.delivery_instructions && (
                            <p className="text-amber-400 italic text-[11px] mt-1">
                              "{order.delivery_instructions}"
                            </p>
                          )}
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${order.delivery_address}, ${order.city} ${order.postal_code}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#333] hover:border-accent text-accent font-bold rounded-xl transition-colors shrink-0"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          GPS Map
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-3 bg-[#0a0a0a] rounded-xl border border-[#222] text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Food Package ({order.items?.length || 0} items)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {order.items?.map((it) => (
                        <span
                          key={it.id}
                          className="px-2.5 py-1 bg-[#161616] border border-[#2c2c2c] rounded-lg text-gray-300"
                        >
                          <strong className="text-accent font-mono">{it.quantity}x</strong> {it.product_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Updation Action Section */}
                  <div className="pt-2 border-t border-[#242424] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    
                    {/* Status Note or Rider Assigned */}
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <Bike className="w-4 h-4 text-accent" />
                      <span>
                        Assigned: <strong className="text-white">{order.assigned_delivery_partner || 'Unassigned'}</strong>
                      </span>
                    </div>

                    {/* Big Action Buttons */}
                    <div>
                      {isReadyForPickup && (
                        <button
                          onClick={() => handlePickupOrder(order)}
                          disabled={isProcessing}
                          className="w-full sm:w-auto px-6 py-3 bg-accent hover:bg-white text-black font-chunky text-base tracking-wider rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Bike className="w-5 h-5" />
                          {isProcessing ? 'Claiming Order...' : 'Accept & Start Delivery'}
                        </button>
                      )}

                      {isOutForDelivery && (
                        <button
                          onClick={() => openOtpModal(order)}
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-accent to-yellow-400 hover:from-white hover:to-accent text-black font-chunky text-base tracking-wider rounded-xl transition-all shadow-xl shadow-accent/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <ShieldCheck className="w-5 h-5 text-black" />
                          Enter Customer OTP & Deliver
                        </button>
                      )}

                      {isDelivered && (
                        <div className="text-xs text-green-400 font-mono font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Delivered at {new Date(order.delivered_at || order.updated_at).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Customer OTP Verification Modal */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#141414] border-2 border-accent rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white text-center relative">
            <button
              onClick={() => setOtpModalOrder(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header Icon */}
            <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent text-accent flex items-center justify-center mx-auto shadow-xl shadow-accent/20">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-chunky text-2xl tracking-wide text-white">
                VERIFY DELIVERY OTP
              </h3>
              <p className="text-xs text-gray-300 mt-1.5 max-w-xs mx-auto">
                Ask <strong className="text-white">{otpModalOrder.customer_name}</strong> for the 4-digit code displayed on their SmashCity screen.
              </p>
              <span className="inline-block mt-2 font-mono text-xs text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/30">
                Order: {otpModalOrder.order_number}
              </span>
            </div>

            {/* Error / Success Notifications */}
            {otpError && (
              <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs font-medium">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 bg-green-950/70 border border-green-500/50 rounded-xl text-green-200 text-xs font-bold animate-bounce">
                🎉 {otpSuccess}
              </div>
            )}

            {/* 4-Digit OTP Boxes */}
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
              <div className="flex justify-center gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-14 h-16 text-center text-3xl font-mono font-black bg-[#0a0a0a] border-2 border-[#333] focus:border-accent rounded-2xl text-white focus:outline-none focus:shadow-lg focus:shadow-accent/20 transition-all"
                  />
                ))}
              </div>

              {/* COD Reminder if applicable */}
              {otpModalOrder.payment_method === 'COD' && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs text-left flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold">Cash Collection Required:</span>
                    <p className="text-gray-300">
                      Collect <strong>${otpModalOrder.total_amount}</strong> before handing over the food package.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  className="flex-1 py-3 border border-border hover:bg-[#1a1a1a] text-gray-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingOtp || otpDigits.join('').length < 4}
                  className="flex-1 py-3 bg-accent hover:bg-white text-black font-chunky text-base tracking-wider rounded-xl transition-all shadow-xl shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingOtp ? 'Verifying...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPortal;
