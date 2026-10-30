const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || '127.0.0.1';
    return `http://${host}:8000/api`;
  }
  return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Standard fetch wrapper with auth header injection and error parsing
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('smashcity_auth_token');
  const guestCartKey = localStorage.getItem('smashcity_guest_cart_key');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
    ...(guestCartKey ? { 'X-Guest-Cart-Key': guestCartKey } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    if (typeof data === 'object' && data !== null) {
      if (data.error) errorMsg = data.error;
      else if (data.detail) errorMsg = data.detail;
      else if (data.message) errorMsg = data.message;
      else {
        // Collect field errors
        const messages = [];
        for (const [key, val] of Object.entries(data)) {
          messages.push(`${key}: ${Array.isArray(val) ? val.join(', ') : val}`);
        }
        errorMsg = messages.join(' | ') || errorMsg;
      }
    } else if (typeof data === 'string') {
      errorMsg = data;
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication APIs
export const authApi = {
  register: (userData) => apiRequest('/auth/register/', { method: 'POST', body: JSON.stringify(userData) }),
  login: (credentials) => apiRequest('/auth/login/', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => apiRequest('/auth/logout/', { method: 'POST' }),
  getCurrentUser: () => apiRequest('/auth/me/'),
  updateProfile: (profileData) => apiRequest('/auth/me/', { method: 'PATCH', body: JSON.stringify(profileData) }),
  getAddresses: () => apiRequest('/auth/addresses/'),
  createAddress: (addrData) => apiRequest('/auth/addresses/', { method: 'POST', body: JSON.stringify(addrData) }),
  deleteAddress: (id) => apiRequest(`/auth/addresses/${id}/`, { method: 'DELETE' }),
};

// Menu APIs
export const menuApi = {
  getCategories: () => apiRequest('/menu/categories/'),
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/menu/products/${query ? `?${query}` : ''}`);
  },
  getProductDetail: (id) => apiRequest(`/menu/products/${id}/`),
  createProduct: (productData) =>
    apiRequest('/menu/products/', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id, productData) =>
    apiRequest(`/menu/products/${id}/`, { method: 'PATCH', body: JSON.stringify(productData) }),
  deleteProduct: (id) =>
    apiRequest(`/menu/products/${id}/`, { method: 'DELETE' }),
};

// Cart APIs
export const cartApi = {
  getCart: () => apiRequest('/cart/'),
  addItem: (productId, quantity = 1) => 
    apiRequest('/cart/items/', { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) }),
  updateItem: (itemId, quantity) => 
    apiRequest(`/cart/items/${itemId}/`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeItem: (itemId) => 
    apiRequest(`/cart/items/${itemId}/`, { method: 'DELETE' }),
  clearCart: () => 
    apiRequest('/cart/', { method: 'DELETE' }),
};

// Orders APIs
export const ordersApi = {
  createOrder: (orderData) => apiRequest('/orders/', { method: 'POST', body: JSON.stringify(orderData) }),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders/${query ? `?${query}` : ''}`);
  },
  getAllOrders: (params = {}) => {
    const query = new URLSearchParams({ all: 'true', ...params }).toString();
    return apiRequest(`/orders/?${query}`);
  },
  getOrderDetail: (orderNumber) => apiRequest(`/orders/${orderNumber}/`),
  updateOrderStatus: (orderNumber, statusData) =>
    apiRequest(`/delivery/${orderNumber}/status/`, { method: 'POST', body: JSON.stringify(statusData) }),
  cancelOrder: (orderNumber) => apiRequest(`/orders/${orderNumber}/cancel/`, { method: 'POST' }),
  validateCoupon: (code, subtotal) => 
    apiRequest('/orders/validate-coupon/', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
};

// Payments APIs
export const paymentsApi = {
  createRazorpayOrder: (orderNumber) => 
    apiRequest('/payments/create/', { method: 'POST', body: JSON.stringify({ order_number: orderNumber }) }),
  verifyPayment: (paymentDetails) => 
    apiRequest('/payments/verify/', { method: 'POST', body: JSON.stringify(paymentDetails) }),
};

// Delivery APIs
export const deliveryApi = {
  getDeliveryOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/delivery/orders/${query ? `?${query}` : ''}`);
  },
  getTracking: (orderNumber) => apiRequest(`/delivery/${orderNumber}/`),
  pickupOrder: (orderNumber, riderInfo = {}) =>
    apiRequest(`/delivery/${orderNumber}/pickup/`, { method: 'POST', body: JSON.stringify(riderInfo) }),
  verifyDeliveryOtp: (orderNumber, otp, riderInfo = {}) =>
    apiRequest(`/delivery/${orderNumber}/verify-otp/`, { method: 'POST', body: JSON.stringify({ otp, ...riderInfo }) }),
  updateStatus: (orderNumber, statusData) =>
    apiRequest(`/delivery/${orderNumber}/status/`, { method: 'POST', body: JSON.stringify(statusData) }),
};
