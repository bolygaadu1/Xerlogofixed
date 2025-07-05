const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs in production
  : 'http://localhost:3001';

// API service for orders
export const ordersAPI = {
  // Get all orders
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/orders`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return response.json();
  },

  // Get single order by ID
  getById: async (orderId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch order');
    }
    return response.json();
  },

  // Create new order
  create: async (orderData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      throw new Error('Failed to create order');
    }
    return response.json();
  },

  // Update order status
  updateStatus: async (orderId: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    return response.json();
  },

  // Delete all orders
  deleteAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/orders/all`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete orders');
    }
    return response.json();
  },
};

// API service for authentication
export const authAPI = {
  // Login
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  // Verify token
  verify: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Token verification failed');
    }
    return response.json();
  },
};