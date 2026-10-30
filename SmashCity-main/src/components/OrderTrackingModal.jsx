import React, { useState, useEffect } from 'react';
import { X, Check, Clock, AlertTriangle, RefreshCw, XCircle, MapPin, Phone, ChefHat, Bike, PackageCheck, Flame, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deliveryApi, ordersApi } from '../services/api';

const OrderTrackingModal = () => {
  const { trackingOrderNumber, closeTracking } = useAuth();

  const [trackingData, setTrackingData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchTracking = async (isInitial = false) => {
    if (!trackingOrderNumber) return;
    if (isInitial) setLoading(true);

    try {
      const [trackingRes, orderRes] = await Promise.all([
        deliveryApi.getTracking(trackingOrderNumber),
        ordersApi.getOrderDetail(trackingOrderNumber),
      ]);
      setTrackingData(trackingRes);
      setOrderDetails(orderRes);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load tracking information.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingOrderNumber) {
      fetchTracking(true);
      // Poll every 5 seconds for live status updates
      const interval = setInterval(() => {
        fetchTracking(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [trackingOrderNumber]);

  if (!trackingOrderNumber) return null;

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await ordersApi.cancelOrder(trackingOrderNumber);
      await fetchTracking(true);
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const getStepIcon = (key) => {
    switch (key) {
      case 'ORDER_PLACED': return <Clock className="w-5 h-5" />;
      case 'ORDER_CONFIRMED': return <Check className="w-5 h-5" />;
      case 'PREPARING': return <Flame className="w-5 h-5" />;
      case 'READY_FOR_PICKUP': return <PackageCheck className="w-5 h-5" />;
      case 'OUT_FOR_DELIVERY': return <Bike className="w-5 h-5" />;
      case 'DELIVERED': return <Check className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#141414] border-2 border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl my-8 text-white max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 50px rgba(255, 215, 0, 0.15)' }}
      >
        {/* Close Button */}
        <button
          onClick={closeTracking}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
          aria-label="Close tracking"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-accent/10 border border-accent/30 rounded text-accent text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              Live Delivery Tracking
            </div>
            <h2 className="text-3xl font-chunky tracking-wide text-white">
              ORDER <span className="text-accent">{trackingOrderNumber}</span>
            </h2>
          </div>

          <button
            onClick={() => fetchTracking(true)}
            className="self-start sm:self-auto p-2 bg-surface border border-border hover:border-accent rounded text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-xl mb-6 text-red-200 text-xs">
            {error}
          </div>
        )}

        {loading && !trackingData ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Connecting to Kitchen Grill...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Status Hero Box */}
            <div className={`p-6 rounded-2xl border text-center ${
              trackingData?.current_status === 'DELIVERED' 
                ? 'bg-green-950/20 border-green-500/40' 
                : trackingData?.current_status === 'CANCELLED'
                ? 'bg-red-950/20 border-red-500/40'
                : 'bg-[#0E0E0E] border-border'
            }`}>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Current Status</span>
              <h3 className={`text-3xl sm:text-4xl font-display tracking-widest mt-1 ${
                trackingData?.current_status === 'DELIVERED'
                  ? 'text-green-400'
                  : trackingData?.current_status === 'CANCELLED'
                  ? 'text-red-500'
                  : 'text-accent'
              }`}>
                {trackingData?.status_display}
              </h3>

              {trackingData?.estimated_delivery_time && trackingData?.current_status !== 'DELIVERED' && trackingData?.current_status !== 'CANCELLED' && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-gray-300 bg-surface px-4 py-1.5 rounded-full border border-border">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  Estimated Delivery by {new Date(trackingData.estimated_delivery_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Delivery Verification OTP Callout */}
            {trackingData?.delivery_otp && trackingData?.current_status !== 'DELIVERED' && trackingData?.current_status !== 'CANCELLED' && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-accent/15 to-amber-500/10 border-2 border-accent/60 text-center relative overflow-hidden shadow-xl shadow-accent/5">
                <div className="flex items-center justify-center gap-2 text-accent text-xs font-bold uppercase tracking-widest mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  Secure Delivery Verification OTP
                </div>
                <div className="font-mono text-4xl sm:text-5xl font-black tracking-[0.3em] text-white my-2 select-all drop-shadow">
                  {trackingData.delivery_otp}
                </div>
                <p className="text-xs text-gray-300 max-w-md mx-auto">
                  Share this 4-digit OTP with your SmashCity delivery partner upon arrival to verify and complete delivery.
                </p>
                {trackingData.assigned_delivery_partner && (
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-accent font-medium bg-black/50 px-3.5 py-1.5 rounded-full border border-accent/30">
                    <Bike className="w-4 h-4" />
                    Delivery Rider: <strong className="text-white">{trackingData.assigned_delivery_partner}</strong>
                    {trackingData.delivery_partner_phone && (
                      <span className="text-gray-400">({trackingData.delivery_partner_phone})</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 6-Step Delivery Progress Stepper */}
            {trackingData?.current_status !== 'CANCELLED' && trackingData?.steps && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Delivery Progress</h4>
                
                <div className="space-y-3">
                  {trackingData.steps.map((step, idx) => {
                    const isCompleted = trackingData.current_step_index > idx;
                    const isCurrent = trackingData.current_step_index === idx;

                    return (
                      <div 
                        key={step.key}
                        className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-accent/10 border-accent text-white shadow-lg shadow-accent/5'
                            : isCompleted
                            ? 'bg-[#0A0A0A] border-green-500/30 text-gray-200'
                            : 'bg-[#0A0A0A]/40 border-border/50 text-gray-600'
                        }`}
                      >
                        {/* Step Icon */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                          isCurrent
                            ? 'bg-accent text-black border-accent font-bold'
                            : isCompleted
                            ? 'bg-green-500/20 text-green-400 border-green-500/40'
                            : 'bg-surface text-gray-600 border-border'
                        }`}>
                          {isCompleted ? <Check className="w-5 h-5 text-green-400" /> : getStepIcon(step.key)}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className={`font-display tracking-wider text-base uppercase ${
                              isCurrent ? 'text-accent font-bold' : isCompleted ? 'text-white' : 'text-gray-500'
                            }`}>
                              {idx + 1}. {step.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/20 px-2 py-0.5 rounded">
                                In Progress
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status History Logs */}
            {trackingData?.history && trackingData.history.length > 0 && (
              <div className="p-4 bg-[#0A0A0A] rounded-xl border border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Status Timeline</h4>
                <div className="space-y-2.5">
                  {trackingData.history.map((h) => (
                    <div key={h.id} className="flex justify-between items-start text-xs border-b border-border/40 pb-2">
                      <div>
                        <span className="font-bold text-white uppercase">{h.status_display}</span>
                        {h.note && <p className="text-gray-400 text-[11px] mt-0.5">{h.note}</p>}
                      </div>
                      <span className="text-gray-500 font-mono text-[11px] shrink-0">
                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items & Customer Snapshot */}
            {orderDetails && (
              <div className="p-4 bg-[#0A0A0A] rounded-xl border border-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Order Items</h4>
                <div className="divide-y divide-border/50">
                  {orderDetails.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-accent">{item.quantity}x</span>
                        <span className="font-bold text-white">{item.product_name}</span>
                      </div>
                      <span className="font-mono text-gray-300 font-bold">${item.total_price}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <div className="text-xs text-gray-400 font-bold uppercase">
                    Paid via {orderDetails.payment_method_display} ({orderDetails.payment_status})
                  </div>
                  <div className="font-display text-xl text-accent font-bold">
                    ${orderDetails.total_amount}
                  </div>
                </div>

                <div className="text-xs text-gray-400 pt-2 border-t border-border/40">
                  <span className="font-bold text-gray-300">Delivering to:</span> {orderDetails.delivery_address}, {orderDetails.city}
                </div>
              </div>
            )}

            {/* Cancel Action if permitted */}
            {orderDetails?.can_cancel && (
              <div className="pt-2">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full py-3 border border-red-500/50 hover:bg-red-950/40 text-red-400 font-bold uppercase tracking-widest text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel This Order'}
                </button>
                <p className="text-[11px] text-gray-500 text-center mt-1.5">
                  Cancellation is permitted while the order is placed or awaiting confirmation.
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default OrderTrackingModal;
