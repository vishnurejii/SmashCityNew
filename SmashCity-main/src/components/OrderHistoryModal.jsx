import React, { useState, useEffect } from 'react';
import { X, Clock, Package, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../services/api';

const OrderHistoryModal = () => {
  const { isOrdersModalOpen, closeOrdersModal, openTracking, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getOrders();
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOrdersModalOpen) {
      fetchOrders();
    }
  }, [isOrdersModalOpen]);

  if (!isOrdersModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#141414] border-2 border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl my-8 text-white max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 50px rgba(255, 215, 0, 0.15)' }}
      >
        {/* Close Button */}
        <button
          onClick={closeOrdersModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
          <div>
            <span className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Account Orders</span>
            <h2 className="text-3xl font-chunky tracking-wide text-white mt-1">
              MY ORDER HISTORY
            </h2>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 bg-surface border border-border hover:border-accent rounded text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
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

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Package className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-2xl font-chunky tracking-wide text-white">NO ORDERS YET</h3>
            <p className="font-['Caveat'] text-gray-400 text-xl font-bold">
              You haven't placed any smash burger orders yet. Fresh patties await!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusColors = {
                DELIVERED: 'text-green-400 border-green-500/30 bg-green-950/20',
                CANCELLED: 'text-red-400 border-red-500/30 bg-red-950/20',
                ORDER_PLACED: 'text-blue-400 border-blue-500/30 bg-blue-950/20',
                ORDER_CONFIRMED: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20',
                PREPARING: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
                READY_FOR_PICKUP: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
                OUT_FOR_DELIVERY: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
              };
              const badgeStyle = statusColors[order.status] || 'text-gray-300 border-border bg-surface';

              return (
                <div
                  key={order.id}
                  className="p-5 bg-[#0A0A0A] border border-border hover:border-accent/50 rounded-xl transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/50">
                    <div>
                      <span className="font-mono text-sm font-bold text-accent">{order.order_number}</span>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${badgeStyle}`}>
                        {order.status_display}
                      </span>
                      <span className="font-display text-xl text-white font-bold">
                        ${order.total_amount}
                      </span>
                    </div>
                  </div>

                  {/* Items list preview */}
                  <div className="py-3 text-xs text-gray-300 space-y-1">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span className="font-mono text-gray-400">${item.total_price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400">
                    <div>
                      Payment: <span className="font-bold text-white">{order.payment_method_display}</span> ({order.payment_status})
                    </div>
                    <button
                      onClick={() => {
                        closeOrdersModal();
                        openTracking(order.order_number);
                      }}
                      className="px-4 py-2 bg-accent text-black font-bold uppercase tracking-widest text-[11px] rounded hover:bg-white transition-colors flex items-center gap-1.5 self-end sm:self-auto"
                    >
                      Track Order <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderHistoryModal;
