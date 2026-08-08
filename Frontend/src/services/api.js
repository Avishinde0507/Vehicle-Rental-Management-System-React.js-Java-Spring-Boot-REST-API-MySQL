const API_BASE = 'http://localhost:8080/api';

async function request(url, options = {}) {
  const userStr = localStorage.getItem('vrms_current_user');
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    } catch (e) { }
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const authAPI = {
  login: (email, password) => request('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (userData) => request('/users/register', { method: 'POST', body: JSON.stringify(userData) }),
  sendOTP: (email) => request('/users/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOTP: (email, otp) => request('/users/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  resetPassword: (email, otp, newPassword) => request('/users/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
};

export const userAPI = {
  getAll: () => request('/users'),
  getById: (id) => request(`/users/${id}`),
  getByRole: (role) => request(`/users/role/${role}`),
  toggleActive: (id) => request(`/users/${id}/toggle-active`, { method: 'PUT' }),
  update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export const vehicleAPI = {
  getAll: () => request('/vehicles'),
  getById: (id) => request(`/vehicles/${id}`),
  getByOwner: (ownerId) => request(`/vehicles/owner/${ownerId}`),
  getAvailable: () => request('/vehicles/available'),
  getByLocation: (location) => request(`/vehicles/location/${location}`),
  add: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  approve: (id, approved) => request(`/vehicles/${id}/approve?approved=${approved}`, { method: 'PUT' }),
  updateStatus: (id, status) => request(`/vehicles/${id}/status?status=${status}`, { method: 'PUT' }),
};

export const bookingAPI = {
  getAll: () => request('/bookings'),
  getById: (id) => request(`/bookings/${id}`),
  getByCustomer: (id) => request(`/bookings/customer/${id}`),
  getByOwner: (id) => request(`/bookings/owner/${id}`),
  create: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) => request(`/bookings/${id}/status?status=${status}`, { method: 'PUT' }),
  checkAvailability: (vehicleId, start, end) => request(`/bookings/availability?vehicleId=${vehicleId}&startDate=${start}&endDate=${end}`),
};

export const paymentAPI = {
  createOrder: (amount) => request('/payments/create-order', { method: 'POST', body: JSON.stringify({ amount }) }),
  verifyPayment: (data) => request('/payments/verify-payment', { method: 'POST', body: JSON.stringify(data) }),
};

export const reviewAPI = {
  getAll: () => request('/reviews'),
  getByOwner: (ownerId) => request(`/reviews/owner/${ownerId}`),
  getByCustomer: (customerId) => request(`/reviews/customer/${customerId}`),
  checkReviewed: (bookingId) => request(`/reviews/check/${bookingId}`),
  create: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
};

const getUserEmail = () => {
  try {
    const u = JSON.parse(localStorage.getItem('vrms_current_user') || '{}');
    return u.email || '';
  } catch (e) {
    return '';
  }
};

export const profileAPI = {
  getProfile: () => {
    const email = getUserEmail();
    return request(email ? `/profile?email=${encodeURIComponent(email)}` : '/profile');
  },
  updateProfile: (data) => {
    const email = getUserEmail();
    return request('/profile/update', { method: 'PUT', body: JSON.stringify({ ...data, currentEmail: email }) });
  },
  sendVerifyEmailOTP: () => {
    const email = getUserEmail();
    return request('/profile/send-otp', { method: 'POST', body: JSON.stringify({ email }) });
  },
  verifyEmailOTP: (otp) => {
    const email = getUserEmail();
    return request('/profile/verify-otp', { method: 'POST', body: JSON.stringify({ otp, email }) });
  },
  changePassword: (oldPassword, newPassword) => {
    const email = getUserEmail();
    return request('/profile/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword, email }) });
  },
};

export const complaintAPI = {
  getAll: () => request('/complaints'),
  getById: (id) => request(`/complaints/${id}`),
  getByCustomer: (customerId) => request(`/complaints/customer/${customerId}`),
  getByOwner: (ownerId) => request(`/complaints/owner/${ownerId}`),
  create: (data) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status, resolutionNote, resolvedBy) => request(`/complaints/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, resolutionNote, resolvedBy })
  }),
  delete: (id) => request(`/complaints/${id}`, { method: 'DELETE' }),
};
