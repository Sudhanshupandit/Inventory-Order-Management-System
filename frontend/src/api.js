const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errorJson = await response.json();
      const detail = errorJson.detail ?? errorJson.message;

      if (Array.isArray(detail)) {
        // FastAPI validation errors: [{ loc, msg, type }, ...]
        errorDetail = detail
          .map((d) => {
            const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
            const msg = (d.msg || 'Invalid value').replace(/^Value error,\s*/i, '');
            return field ? `${field}: ${msg}` : msg;
          })
          .join(' • ');
      } else if (typeof detail === 'string') {
        errorDetail = detail;
      } else if (detail) {
        errorDetail = JSON.stringify(detail);
      }
    } catch (e) {
      // Response had no JSON body; keep the generic message.
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getStats: () => request('/dashboard/stats'),
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: data }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: data }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};
