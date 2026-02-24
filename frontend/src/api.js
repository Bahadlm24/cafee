const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';

// Token management
export function getToken() {
  return localStorage.getItem('admin_token');
}

export function setToken(token) {
  localStorage.setItem('admin_token', token);
}

export function removeToken() {
  localStorage.removeItem('admin_token');
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: authHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Bir hata oluştu' }));
    throw new Error(err.error || 'Bir hata oluştu');
  }
  return res.json();
}

// Auth
export const login = (username, password) => request('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const logout = () => request('/logout', { method: 'POST' });
export const verifyToken = () => request('/verify');

// Menu (Public)
export const getMenu = () => request('/menu');

// Categories
export const getCategories = () => request('/categories');
export const createCategory = (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id) => request(`/categories/${id}`, { method: 'DELETE' });

// Products
export const getProducts = (categoryId) => request(`/products${categoryId ? `?category_id=${categoryId}` : ''}`);
export const createProduct = (data) => request('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// Image Upload
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Görsel yüklenemedi' }));
    throw new Error(err.error || 'Görsel yüklenemedi');
  }
  return res.json();
}

// Tables
export const getTables = () => request('/tables');
export const createTable = (data) => request('/tables', { method: 'POST', body: JSON.stringify(data) });
export const updateTable = (id, data) => request(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTable = (id) => request(`/tables/${id}`, { method: 'DELETE' });

// Orders
export const getTableOrders = (tableId) => request(`/tables/${tableId}/orders`);
export const createOrder = (tableId, items) => request(`/tables/${tableId}/orders`, { method: 'POST', body: JSON.stringify({ items }) });
export const transferOrders = (fromTableId, toTableId) => request('/tables/transfer', { method: 'POST', body: JSON.stringify({ from_table_id: fromTableId, to_table_id: toTableId }) });
export const closeOrder = (orderId, payments) => request(`/orders/${orderId}/close`, { method: 'PUT', body: JSON.stringify({ payments }) });
export const getOrderTotal = (orderId) => request(`/orders/${orderId}/total`);

// Reports
export const getPaymentReports = () => request('/reports/payments');
