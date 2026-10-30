import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Bike,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Flame,
  User,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  X,
  ChevronDown,
  Store,
  Truck,
  Plus,
  Trash2,
  UtensilsCrossed,
  Tag,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { ordersApi, deliveryApi, menuApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { key: 'ALL', label: 'All Orders', color: 'border-border text-gray-300' },
  { key: 'ORDER_PLACED', label: 'Placed', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
  { key: 'ORDER_CONFIRMED', label: 'Confirmed', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  { key: 'PREPARING', label: 'Preparing', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'border-accent/40 text-accent bg-accent/10' },
  { key: 'DELIVERED', label: 'Delivered', color: 'border-green-500/40 text-green-400 bg-green-500/10' },
  { key: 'CANCELLED', label: 'Cancelled', color: 'border-red-500/40 text-red-400 bg-red-500/10' },
];

const AdminPortal = ({ onNavigate }) => {
  const { user, login } = useAuth();
  
  // Tab state: 'orders' | 'inventory'
  const [activeAdminTab, setActiveAdminTab] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Menu & Inventory Management State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [menuActionId, setMenuActionId] = useState(null);

  // Add Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductTypeLabel, setNewProductTypeLabel] = useState('Burger');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('/burger-1.webp');
  const [newProductIsVeg, setNewProductIsVeg] = useState(false);
  const [newProductIsAvailable, setNewProductIsAvailable] = useState(true);
  const [newProductIngredients, setNewProductIngredients] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Selected Order for detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Assign Rider modal state
  const [assignRiderOrder, setAssignRiderOrder] = useState(null);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Status updating indicator
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Quick admin login state (if not logged in as admin)
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const fetchMenuData = async () => {
    setMenuLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getProducts({ all: 'true' })
      ]);
      const catList = Array.isArray(cats) ? cats : [];
      setCategories(catList);
      setProducts(Array.isArray(prods) ? prods : []);
      if (catList.length > 0 && !newProductCategory) {
        setNewProductCategory(catList[0].id);
      }
    } catch (err) {
      console.error('Failed to load menu data in admin:', err);
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleToggleProductAvailability = async (product) => {
    setMenuActionId(product.id);
    try {
      const nextAvailability = !product.is_available;
      await menuApi.updateProduct(product.id, { is_available: nextAvailability });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: nextAvailability } : p))
      );
    } catch (err) {
      alert(err.message || 'Failed to update item availability');
    } finally {
      setMenuActionId(null);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"? This cannot be undone.`)) {
      return;
    }
    setMenuActionId(product.id);
    try {
      await menuApi.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setMenuActionId(null);
    }
  };

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) {
      alert('Please provide product name and price.');
      return;
    }
    setCreatingProduct(true);
    try {
      const selectedCatId = parseInt(newProductCategory) || (categories[0]?.id || 1);
      const payload = {
        name: newProductName.trim(),
        category: selectedCatId,
        price: parseFloat(newProductPrice).toFixed(2),
        type_label: newProductTypeLabel.trim() || 'Burger',
        description: newProductDesc.trim() || 'Signature SmashCity preparation crafted with fresh ingredients.',
        image_url: newProductImageUrl.trim() || '/burger-1.webp',
        is_vegetarian: newProductIsVeg,
        is_available: newProductIsAvailable,
        ingredients: newProductIngredients ? newProductIngredients.split(',').map((s) => s.trim()).filter(Boolean) : []
      };
      await menuApi.createProduct(payload);
      setIsAddProductModalOpen(false);
      // Reset form
      setNewProductName('');
      setNewProductPrice('');
      setNewProductDesc('');
      setNewProductIngredients('');
      await fetchMenuData();
    } catch (err) {
      alert(err.message || 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  };

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await ordersApi.getAllOrders();
      setOrders(Array.isArray(res) ? res : []);
      setError('');
    } catch (err) {
      console.error('Failed to load orders for admin:', err);
      setError(err.message || 'Failed to fetch admin orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchOrders(true);
      }, 7000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Handle status transition update
  const handleUpdateStatus = async (orderNumber, newStatus, note = '') => {
    setUpdatingOrderId(orderNumber);
    try {
      await ordersApi.updateOrderStatus(orderNumber, {
        status: newStatus,
        note: note || `Admin updated order status to ${newStatus}`,
      });
      // Refresh local list
      await fetchOrders(true);
      if (selectedOrder && selectedOrder.order_number === orderNumber) {
        const updated = await ordersApi.getOrderDetail(orderNumber);
        setSelectedOrder(updated);
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Assign Delivery Partner
  const handleAssignRiderSubmit = async (e) => {
    e.preventDefault();
    if (!assignRiderOrder) return;
    setAssigning(true);
    try {
      await ordersApi.updateOrderStatus(assignRiderOrder.order_number, {
        status: assignRiderOrder.status === 'READY_FOR_PICKUP' ? 'OUT_FOR_DELIVERY' : assignRiderOrder.status,
        assigned_delivery_partner: riderName.trim(),
        delivery_partner_phone: riderPhone.trim(),
        note: `Assigned delivery partner ${riderName.trim()} (${riderPhone.trim()})`,
      });
      setAssignRiderOrder(null);
      setRiderName('');
      setRiderPhone('');
      await fetchOrders(true);
    } catch (err) {
      alert(err.message || 'Failed to assign delivery partner');
    } finally {
      setAssigning(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      await login({ username: adminUsername, password: adminPassword });
      await fetchOrders(true);
    } catch (err) {
      setLoginError(err.message || 'Failed to authenticate admin');
    } finally {
      setLoggingIn(false);
    }
  };

  // Filter & Search computation
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.order_number.toLowerCase().includes(q) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(q)) ||
      (order.city && order.city.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalOrders = orders.length;
  const inKitchenOrders = orders.filter((o) =>
    ['ORDER_PLACED', 'ORDER_CONFIRMED', 'PREPARING'].includes(o.status)
  ).length;
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP').length;
  const outForDeliveryOrders = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length;
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((acc, curr) => acc + parseFloat(curr.total_amount || 0), 0);

  const getStatusBadge = (st) => {
    const config = STATUS_OPTIONS.find((s) => s.key === st) || {
      label: st,
      color: 'border-border text-gray-400 bg-surface',
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.color}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {config.label}
      </span>
    );
  };

  const availableProductsCount = products.filter((p) => p.is_available).length;
  const unavailableProductsCount = products.filter((p) => !p.is_available).length;

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      productCategoryFilter === 'ALL'
        ? true
        : productCategoryFilter === 'SOLD_OUT'
        ? !p.is_available
        : p.category_slug === productCategoryFilter || p.category === parseInt(productCategoryFilter);
    const q = productSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.type_label && p.type_label.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#080808] text-gray-100 flex flex-col font-sans">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#101010]/95 backdrop-blur-md border-b border-[#222] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent/20 to-accent/40 border border-accent flex items-center justify-center text-accent shadow-lg shadow-accent/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-chunky text-xl tracking-wider text-white">
                  SMASH<span className="text-accent">CITY</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-950/80 text-red-400 border border-red-500/40 rounded">
                  Admin Console
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Live Order Dispatch & Delivery Operations</p>
            </div>
          </div>

          {/* Quick Route Switches */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('store')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#181818] border border-border hover:border-accent text-xs font-bold uppercase tracking-wider text-gray-200 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <Store className="w-4 h-4 text-accent" />
              Storefront
            </button>

            {/* Quick Admin Auth Indicator */}
            {user?.is_staff || user?.username === 'admin' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-950/40 border border-green-500/40 text-green-300 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Staff: {user.username}
              </div>
            ) : (
              <button
                onClick={() => setLoginError(loginError ? '' : 'login_toggle')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/40 text-xs font-bold tracking-wider"
              >
                <User className="w-3.5 h-3.5" />
                Staff Login
              </button>
            )}
          </div>
        </div>

        {/* Quick Staff Login Form (if toggled) */}
        {loginError === 'login_toggle' && (
          <form
            onSubmit={handleAdminLogin}
            className="max-w-7xl mx-auto mt-3 pt-3 border-t border-[#222] flex flex-wrap items-center gap-3 text-xs"
          >
            <span className="text-gray-400 font-bold uppercase tracking-wider">Login as Admin:</span>
            <input
              type="text"
              placeholder="Username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              className="px-2.5 py-1.5 bg-[#181818] border border-border rounded text-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="px-2.5 py-1.5 bg-[#181818] border border-border rounded text-white"
            />
            <button
              type="submit"
              disabled={loggingIn}
              className="px-3 py-1.5 bg-accent text-black font-bold uppercase rounded hover:bg-white transition-colors"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setLoginError('')}
              className="text-gray-500 hover:text-white"
            >
              Cancel
            </button>
          </form>
        )}
      </header>

      {/* Sub-Header Navigation Tabs */}
      <div className="bg-[#0e0e0e] border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-4">
          <button
            onClick={() => setActiveAdminTab('orders')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-bold uppercase tracking-wider text-xs transition-all ${
              activeAdminTab === 'orders'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Dispatch</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeAdminTab === 'orders' ? 'bg-accent/20 text-accent font-bold' : 'bg-[#1e1e1e] text-gray-400'
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('inventory');
              fetchMenuData();
            }}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-bold uppercase tracking-wider text-xs transition-all ${
              activeAdminTab === 'inventory'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu & Items Management</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeAdminTab === 'inventory' ? 'bg-accent/20 text-accent font-bold' : 'bg-[#1e1e1e] text-gray-400'
              }`}
            >
              {products.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeAdminTab === 'orders' && (
          <>
            {/* KPI Metrics Dashboard Bar */}
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              Total Orders <Package className="w-4 h-4 text-gray-500" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-white mt-2">
              {totalOrders}
            </span>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center justify-between">
              In Kitchen <Flame className="w-4 h-4 text-orange-400" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-orange-400 mt-2">
              {inKitchenOrders}
            </span>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
              Ready <Clock className="w-4 h-4 text-purple-400" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-purple-400 mt-2">
              {readyOrders}
            </span>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center justify-between">
              On Road <Bike className="w-4 h-4 text-accent" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-accent mt-2">
              {outForDeliveryOrders}
            </span>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-green-400 flex items-center justify-between">
              Delivered <CheckCircle2 className="w-4 h-4 text-green-400" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-green-400 mt-2">
              {deliveredOrders}
            </span>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
              Gross Sales <DollarSign className="w-4 h-4 text-emerald-400" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-emerald-400 mt-2">
              ${totalRevenue.toFixed(2)}
            </span>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <div className="bg-[#121212] border border-[#222] rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by Order #, Customer Name, Phone, or City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#181818] border border-[#2d2d2d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Refresh and Auto-refresh Controls */}
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-2 text-xs font-mono text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded bg-[#1c1c1c] border-border text-accent focus:ring-0"
                />
                Live Auto-Sync
              </label>

              <button
                onClick={() => fetchOrders(false)}
                disabled={loading || refreshing}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] hover:border-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-accent' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_OPTIONS.map((opt) => {
              const count =
                opt.key === 'ALL'
                  ? orders.length
                  : orders.filter((o) => o.status === opt.key).length;
              const isSelected = statusFilter === opt.key;

              return (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-accent text-black border-accent shadow-md shadow-accent/10'
                      : 'bg-[#181818] text-gray-400 border-transparent hover:border-[#333] hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-black text-accent' : 'bg-[#222] text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Table & Cards */}
        {loading && orders.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#121212] border border-[#222] rounded-2xl">
            <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Fetching SmashCity Orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-[#121212] border border-[#222] rounded-2xl">
            <Package className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="text-base font-bold text-gray-300">No orders found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are no orders matching your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isUpdating = updatingOrderId === order.order_number;

              return (
                <div
                  key={order.id}
                  className="bg-[#121212] hover:bg-[#151515] border border-[#242424] hover:border-[#383838] rounded-2xl p-4 sm:p-5 transition-all shadow-lg space-y-4"
                >
                  {/* Top Bar: Order Number, Customer, Date, Status */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#222]">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-base font-black text-white tracking-wider flex items-center gap-2">
                        <span>{order.order_number}</span>
                      </div>
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Customer Info Snapshot */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-200">
                        <User className="w-3.5 h-3.5 text-accent" />
                        <span className="font-bold">{order.customer_name}</span>
                      </div>
                      {order.customer_phone && (
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="flex items-center gap-1.5 text-gray-300 hover:text-accent font-mono"
                        >
                          <Phone className="w-3.5 h-3.5 text-accent" />
                          <span>{order.customer_phone}</span>
                        </a>
                      )}
                      <div className="text-right font-display text-lg font-bold text-accent">
                        ${order.total_amount}{' '}
                        <span className="text-[10px] font-sans font-normal text-gray-400 uppercase">
                          ({order.payment_method} - {order.payment_status})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Items, Address & Delivery Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Items Breakdown */}
                    <div className="space-y-1.5 bg-[#0a0a0a] p-3 rounded-xl border border-[#1f1f1f]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Ordered Items ({order.items?.length || 0})
                      </span>
                      <div className="space-y-1">
                        {order.items?.map((it) => (
                          <div key={it.id} className="flex justify-between items-center text-gray-300">
                            <span>
                              <strong className="text-accent font-mono">{it.quantity}x</strong> {it.product_name}
                            </span>
                            <span className="font-mono text-gray-400">${it.total_price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address & Delivery Notes */}
                    <div className="space-y-1.5 bg-[#0a0a0a] p-3 rounded-xl border border-[#1f1f1f]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Delivery Destination
                      </span>
                      <div className="flex items-start gap-2 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{order.delivery_address}</p>
                          <p className="text-gray-400">{order.city} {order.postal_code}</p>
                          {order.delivery_instructions && (
                            <p className="text-amber-400/90 text-[11px] mt-1 italic">
                              "{order.delivery_instructions}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Partner & OTP Security Box */}
                    <div className="space-y-2 bg-[#0a0a0a] p-3 rounded-xl border border-[#1f1f1f] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                          Delivery Verification
                        </span>

                        {/* Customer Delivery OTP */}
                        <div className="flex items-center justify-between bg-black/60 px-3 py-1.5 rounded-lg border border-accent/30 mb-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1.5 font-bold uppercase">
                            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                            Customer OTP:
                          </span>
                          <span className="font-mono text-base font-black tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {order.delivery_otp || '----'}
                          </span>
                        </div>

                        {/* Assigned Rider Info */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Rider:</span>
                          <span className="font-bold text-white">
                            {order.assigned_delivery_partner || 'Unassigned'}
                            {order.delivery_partner_phone && ` (${order.delivery_partner_phone})`}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setAssignRiderOrder(order);
                          setRiderName(order.assigned_delivery_partner || '');
                          setRiderPhone(order.delivery_partner_phone || '');
                        }}
                        className="w-full py-1.5 bg-[#1e1e1e] hover:bg-[#282828] border border-[#333] hover:border-accent text-accent font-bold uppercase tracking-wider text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        {order.assigned_delivery_partner ? 'Reassign Rider' : 'Assign Rider'}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Quick Status Updation Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#1f1f1f]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Update Status:
                      </span>

                      {/* Dynamic Next Step Button */}
                      {order.status === 'ORDER_PLACED' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.order_number, 'ORDER_CONFIRMED')}
                          className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          Confirm Order
                        </button>
                      )}

                      {order.status === 'ORDER_CONFIRMED' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.order_number, 'PREPARING')}
                          className="px-3 py-1 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 text-orange-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          Start Kitchen Prep
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.order_number, 'READY_FOR_PICKUP')}
                          className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          Ready for Pickup
                        </button>
                      )}

                      {order.status === 'READY_FOR_PICKUP' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.order_number, 'OUT_FOR_DELIVERY')}
                          className="px-3 py-1 bg-accent/20 hover:bg-accent/30 border border-accent/50 text-accent text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          Dispatch (Out for Delivery)
                        </button>
                      )}

                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.order_number, 'DELIVERED', 'Admin manually verified delivery')}
                          className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 text-green-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {/* Manual Status Selector Dropdown */}
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.order_number, e.target.value)}
                        disabled={isUpdating}
                        className="bg-[#1a1a1a] border border-[#333] hover:border-accent text-gray-300 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none"
                      >
                        <option value="ORDER_PLACED">Placed</option>
                        <option value="ORDER_CONFIRMED">Confirmed</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.can_cancel && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleUpdateStatus(order.order_number, 'CANCELLED', 'Order cancelled by Admin')}
                          className="px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1 bg-surface border border-border hover:border-accent text-gray-200 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        Full Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    )}

    {/* TAB 2: MENU & ITEMS INVENTORY MANAGEMENT */}
    {activeAdminTab === 'inventory' && (
      <div className="space-y-6 animate-in fade-in">
        {/* KPI Metrics Dashboard Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              Total Items <UtensilsCrossed className="w-4 h-4 text-gray-500" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-white mt-2">
              {products.length}
            </span>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-green-400 flex items-center justify-between">
              Available Now <CheckCircle2 className="w-4 h-4 text-green-400" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-green-400 mt-2">
              {availableProductsCount}
            </span>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center justify-between">
              Sold Out / Unavailable <XCircle className="w-4 h-4 text-red-400" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-red-400 mt-2">
              {unavailableProductsCount}
            </span>
          </div>

          <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center justify-between">
              Active Categories <Tag className="w-4 h-4 text-accent" />
            </span>
            <span className="text-2xl sm:text-3xl font-display font-bold text-accent mt-2">
              {categories.length}
            </span>
          </div>
        </section>

        {/* Filter, Search & Add Action Bar */}
        <div className="bg-[#121212] border border-[#222] rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search menu items by name, type, or description..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#181818] border border-[#2d2d2d] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
              {productSearchQuery && (
                <button
                  onClick={() => setProductSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add Product & Refresh Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-white text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-accent/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Add New Item
              </button>

              <button
                onClick={fetchMenuData}
                disabled={menuLoading}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] hover:border-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${menuLoading ? 'animate-spin text-accent' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setProductCategoryFilter('ALL')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                productCategoryFilter === 'ALL'
                  ? 'bg-accent text-black border-accent shadow-md shadow-accent/10'
                  : 'bg-[#181818] text-gray-400 border-transparent hover:border-[#333] hover:text-white'
              }`}
            >
              All Items
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${productCategoryFilter === 'ALL' ? 'bg-black text-accent font-bold' : 'bg-[#222] text-gray-400'}`}>
                {products.length}
              </span>
            </button>

            {categories.map((c) => {
              const count = products.filter((p) => p.category === c.id || p.category_slug === c.slug).length;
              const isSelected = productCategoryFilter === c.slug || productCategoryFilter === String(c.id);

              return (
                <button
                  key={c.id}
                  onClick={() => setProductCategoryFilter(c.slug)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-accent text-black border-accent shadow-md shadow-accent/10'
                      : 'bg-[#181818] text-gray-400 border-transparent hover:border-[#333] hover:text-white'
                  }`}
                >
                  {c.name}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-black text-accent font-bold' : 'bg-[#222] text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setProductCategoryFilter('SOLD_OUT')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                productCategoryFilter === 'SOLD_OUT'
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20'
                  : 'bg-[#181818] text-red-400 border-transparent hover:border-red-900/40 hover:text-red-300'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              Sold Out / Unavailable
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${productCategoryFilter === 'SOLD_OUT' ? 'bg-black text-red-400 font-bold' : 'bg-[#222] text-red-400'}`}>
                {unavailableProductsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Menu Items Grid */}
        {menuLoading && products.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#121212] border border-[#222] rounded-2xl">
            <RefreshCw className="w-8 h-8 text-accent animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Loading SmashCity Menu Items...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-[#121212] border border-[#222] rounded-2xl">
            <UtensilsCrossed className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="text-base font-bold text-gray-300">No items match your criteria</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Try adjusting your search query or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredProducts.map((product) => {
              const isActing = menuActionId === product.id;
              const itemImg = product.effective_image_url || product.image || product.image_url || '/burger-1.webp';

              return (
                <div
                  key={product.id}
                  className={`bg-[#121212] hover:bg-[#151515] border rounded-2xl p-4 sm:p-5 transition-all shadow-lg flex flex-col justify-between space-y-4 ${
                    product.is_available
                      ? 'border-[#262626] hover:border-[#383838]'
                      : 'border-red-900/40 bg-red-950/10'
                  }`}
                >
                  {/* Product Info Header */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#2c2c2c] bg-black">
                        <img
                          src={itemImg}
                          alt={product.name}
                          className={`w-full h-full object-cover ${product.is_available ? '' : 'grayscale opacity-60'}`}
                        />
                        {!product.is_available && (
                          <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center">
                            <span className="text-[9px] font-black uppercase text-red-200 tracking-wider text-center px-1">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-[#1c1c1c] text-gray-400 border border-[#2d2d2d]">
                            {product.category_name || 'Item'}
                          </span>
                          {product.type_label && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                              {product.type_label}
                            </span>
                          )}
                          {product.is_vegetarian && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-green-950/50 text-green-400 border border-green-600/30">
                              Veg
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-white truncate">{product.name}</h4>
                        <p className="font-display text-lg font-bold text-accent">
                          ${parseFloat(product.price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {product.description || 'No description provided.'}
                    </p>

                    {/* Ingredients */}
                    {product.ingredients && product.ingredients.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.ingredients.slice(0, 4).map((ing, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-gray-400 bg-[#181818] px-2 py-0.5 rounded border border-[#282828]"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Controls & Actions */}
                  <div className="pt-3 border-t border-[#1f1f1f] space-y-2.5">
                    {/* Live Availability Toggle Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            product.is_available ? 'bg-green-400 animate-pulse' : 'bg-red-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            product.is_available ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {product.is_available ? 'Available' : 'Not Available'}
                        </span>
                      </div>

                      <button
                        disabled={isActing}
                        onClick={() => handleToggleProductAvailability(product)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border shadow-sm cursor-pointer ${
                          product.is_available
                            ? 'bg-orange-950/30 hover:bg-orange-900/50 text-orange-400 border-orange-500/40 hover:border-orange-500'
                            : 'bg-green-950/40 hover:bg-green-900/60 text-green-300 border-green-500/50 hover:border-green-400'
                        }`}
                      >
                        {product.is_available ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Mark Not Available</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Mark Available</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Delete Button */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-500 font-mono">ID: #{product.id}</span>
                      <button
                        disabled={isActing}
                        onClick={() => handleDeleteProduct(product)}
                        className="px-2.5 py-1 text-red-400/80 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Item
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}
  </main>

      {/* Assign Delivery Partner Modal */}
      {assignRiderOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#141414] border-2 border-border rounded-2xl p-6 shadow-2xl space-y-5 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-[#262626]">
              <div className="flex items-center gap-2.5">
                <Bike className="w-5 h-5 text-accent" />
                <h3 className="font-chunky text-xl tracking-wide">Assign Delivery Rider</h3>
              </div>
              <button
                onClick={() => setAssignRiderOrder(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Assign a rider to order <strong className="text-accent font-mono">{assignRiderOrder.order_number}</strong>.
              This will update customer tracking and notify rider app.
            </p>

            <form onSubmit={handleAssignRiderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Rider Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Swift, John Davis"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Rider Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0192"
                  value={riderPhone}
                  onChange={(e) => setRiderPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white"
                />
              </div>

              {/* Preset Riders */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Quick Select Active Riders:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Alex Swift', phone: '+1 555-8391' },
                    { name: 'Sam Runner', phone: '+1 555-4820' },
                    { name: 'Marcus Jet', phone: '+1 555-2947' },
                  ].map((r) => (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => {
                        setRiderName(r.name);
                        setRiderPhone(r.phone);
                      }}
                      className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-accent hover:text-black border border-[#333] rounded text-[11px] font-bold transition-colors"
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignRiderOrder(null)}
                  className="px-4 py-2 border border-border text-gray-400 hover:text-white rounded-xl text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 bg-accent hover:bg-white text-black font-bold uppercase text-xs rounded-xl transition-colors shadow-lg shadow-accent/10"
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#141414] border-2 border-border rounded-2xl p-6 sm:p-8 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-[#262626]">
              <Package className="w-6 h-6 text-accent" />
              <div>
                <h3 className="font-chunky text-2xl tracking-wide">
                  Order <span className="text-accent">{selectedOrder.order_number}</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* OTP Alert Box */}
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent block">
                  Customer Delivery Verification OTP
                </span>
                <p className="text-xs text-gray-300">
                  Delivery partner must enter this code upon delivery to verify handoff.
                </p>
              </div>
              <span className="font-mono text-3xl font-black tracking-widest text-white bg-black/60 px-4 py-1.5 rounded-xl border border-accent/30">
                {selectedOrder.delivery_otp || '----'}
              </span>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-[#0a0a0a] rounded-xl border border-[#222] space-y-1">
                <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Customer
                </span>
                <p className="font-bold text-white text-sm">{selectedOrder.customer_name}</p>
                <p className="text-gray-400">{selectedOrder.customer_phone}</p>
                {selectedOrder.customer_email && <p className="text-gray-400">{selectedOrder.customer_email}</p>}
              </div>

              <div className="p-3.5 bg-[#0a0a0a] rounded-xl border border-[#222] space-y-1">
                <span className="font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Delivery Address
                </span>
                <p className="text-gray-200">{selectedOrder.delivery_address}</p>
                <p className="text-gray-400">{selectedOrder.city} {selectedOrder.postal_code}</p>
                {selectedOrder.delivery_instructions && (
                  <p className="text-amber-400 italic mt-1">"{selectedOrder.delivery_instructions}"</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#222] space-y-2">
              <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-2">
                Order Items ({selectedOrder.items?.length})
              </span>
              <div className="divide-y divide-[#222]">
                {selectedOrder.items?.map((it) => (
                  <div key={it.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-accent">{it.quantity}x</span>
                      <span className="font-bold text-white">{it.product_name}</span>
                    </div>
                    <span className="font-mono text-gray-300 font-bold">${it.total_price}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#222] flex justify-between items-center text-xs">
                <span className="text-gray-400">
                  Payment: {selectedOrder.payment_method_display} ({selectedOrder.payment_status})
                </span>
                <span className="font-display text-xl text-accent font-bold">
                  Total: ${selectedOrder.total_amount}
                </span>
              </div>
            </div>

            {/* Status History Logs */}
            {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
              <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#222] space-y-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Status History & Logs
                </span>
                <div className="space-y-2">
                  {selectedOrder.status_history.map((h) => (
                    <div key={h.id} className="flex justify-between items-start border-b border-[#1c1c1c] pb-1.5">
                      <div>
                        <span className="font-bold text-white">{h.status_display}</span>
                        {h.note && <p className="text-gray-400 text-[11px] mt-0.5">{h.note}</p>}
                      </div>
                      <span className="text-gray-500 font-mono text-[11px]">
                        {new Date(h.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Menu Item Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#141414] border-2 border-border rounded-2xl p-6 sm:p-7 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setIsAddProductModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-[#262626]">
              <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent flex items-center justify-center text-accent">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-chunky text-2xl tracking-wide">Add New Menu Item</h3>
                <p className="text-xs text-gray-400">Publish a new burger, side, sauce, or beverage to SmashCity</p>
              </div>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smoky BBQ Smash, Truffle Aioli Dip"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 9.50"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Type Label */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Type Label (Badge)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Single Patty, Double Patty, Loaded Side, Dip"
                  value={newProductTypeLabel}
                  onChange={(e) => setNewProductTypeLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Appetizing description of ingredients and flavor profile..."
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white"
                />
              </div>

              {/* Image URL & Quick Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Image Path or URL
                </label>
                <input
                  type="text"
                  placeholder="/burger-1.webp or full URL"
                  value={newProductImageUrl}
                  onChange={(e) => setNewProductImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white font-mono mb-2"
                />

                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Quick Select Default Image:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Classic Burger', url: '/burger-1.webp' },
                    { label: 'Double Burger', url: '/burger-2.webp' },
                    { label: 'Inferno Burger', url: '/burger-3.webp' },
                    { label: 'Truffle Burger', url: '/burger-4.webp' },
                    { label: 'Crispy Fries', url: '/side-1.webp' },
                    { label: 'Loaded Fries', url: '/side-2.webp' },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setNewProductImageUrl(preset.url)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                        newProductImageUrl === preset.url
                          ? 'bg-accent text-black border-accent'
                          : 'bg-[#1a1a1a] text-gray-300 border-[#333] hover:border-gray-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Ingredients (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chicken Patty, American Cheese, Pickles, Secret Sauce"
                  value={newProductIngredients}
                  onChange={(e) => setNewProductIngredients(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0a0a0a] border border-[#2d2d2d] focus:border-accent rounded-xl text-xs text-white"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0a0a0a] border border-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductIsAvailable}
                    onChange={(e) => setNewProductIsAvailable(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#333] text-accent focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white block">
                      Available Immediately
                    </span>
                    <span className="text-[11px] text-gray-400">Can be ordered right away</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0a0a0a] border border-[#262626] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductIsVeg}
                    onChange={(e) => setNewProductIsVeg(e.target.checked)}
                    className="rounded bg-[#1a1a1a] border-[#333] text-green-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white block">
                      Vegetarian Option
                    </span>
                    <span className="text-[11px] text-gray-400">Flag as vegetarian item</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 border border-border text-gray-400 hover:text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="px-6 py-2 bg-accent hover:bg-white text-black font-black uppercase text-xs rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center gap-2 cursor-pointer"
                >
                  {creatingProduct ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[3]" />
                      Add Item to Menu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
