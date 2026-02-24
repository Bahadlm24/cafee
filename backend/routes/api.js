const express = require('express');
const router = express.Router();
const { loadDB, saveDB } = require('../database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// ==================== AUTH ====================

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';
const activeTokens = new Set();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    res.json({ token, message: 'Giriş başarılı' });
  } else {
    res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  }
});

router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) activeTokens.delete(token);
  res.json({ message: 'Çıkış yapıldı' });
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && activeTokens.has(token)) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Auth middleware — only protects write operations
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli. Lütfen giriş yapın.' });
  }
  next();
}
// ==================== CATEGORIES ====================

router.get('/categories', (req, res) => {
  const db = loadDB();
  const sorted = db.categories.sort((a, b) => a.sort_order - b.sort_order);
  res.json(sorted);
});

router.post('/categories', requireAdmin, (req, res) => {
  const { name, icon, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Kategori adı gerekli' });
  const db = loadDB();
  const category = {
    id: uuidv4(),
    name,
    icon: icon || '🍽️',
    sort_order: sort_order || 0,
    created_at: new Date().toISOString()
  };
  db.categories.push(category);
  saveDB(db);
  res.status(201).json(category);
});

router.put('/categories/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Kategori bulunamadı' });
  const { name, icon, sort_order } = req.body;
  if (name !== undefined) db.categories[idx].name = name;
  if (icon !== undefined) db.categories[idx].icon = icon;
  if (sort_order !== undefined) db.categories[idx].sort_order = sort_order;
  saveDB(db);
  res.json(db.categories[idx]);
});

router.delete('/categories/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Kategori bulunamadı' });
  db.categories.splice(idx, 1);
  // Also remove products in this category
  db.products = db.products.filter(p => p.category_id !== req.params.id);
  saveDB(db);
  res.json({ message: 'Kategori silindi' });
});

// ==================== PRODUCTS ====================

router.get('/products', (req, res) => {
  const db = loadDB();
  let products = db.products;
  if (req.query.category_id) {
    products = products.filter(p => p.category_id === req.query.category_id);
  }
  res.json(products.sort((a, b) => a.sort_order - b.sort_order));
});

router.post('/products', requireAdmin, (req, res) => {
  const { category_id, name, description, ingredients, price, image_url, is_available, sort_order } = req.body;
  if (!category_id || !name) return res.status(400).json({ error: 'Kategori ve ürün adı gerekli' });
  const db = loadDB();
  const product = {
    id: uuidv4(),
    category_id,
    name,
    description: description || '',
    ingredients: ingredients || '',
    price: price || 0,
    image_url: image_url || '',
    is_available: is_available !== undefined ? is_available : true,
    sort_order: sort_order || 0,
    created_at: new Date().toISOString()
  };
  db.products.push(product);
  saveDB(db);
  res.status(201).json(product);
});

router.put('/products/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ürün bulunamadı' });
  const fields = ['category_id', 'name', 'description', 'ingredients', 'price', 'image_url', 'is_available', 'sort_order'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) db.products[idx][f] = req.body[f];
  });
  saveDB(db);
  res.json(db.products[idx]);
});

router.delete('/products/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  db.products = db.products.filter(p => p.id !== req.params.id);
  saveDB(db);
  res.json({ message: 'Ürün silindi' });
});

// ==================== TABLES ====================

router.get('/tables', (req, res) => {
  const db = loadDB();
  res.json(db.tables.sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.name.localeCompare(b.name);
  }));
});

router.post('/tables', requireAdmin, (req, res) => {
  const { name, section } = req.body;
  if (!name) return res.status(400).json({ error: 'Masa adı gerekli' });
  const db = loadDB();
  const table = {
    id: uuidv4(),
    name,
    section: section || 'indoor',
    is_occupied: false,
    created_at: new Date().toISOString()
  };
  db.tables.push(table);
  saveDB(db);
  res.status(201).json(table);
});

router.put('/tables/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  const idx = db.tables.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Masa bulunamadı' });
  const { name, section, is_occupied } = req.body;
  if (name !== undefined) db.tables[idx].name = name;
  if (section !== undefined) db.tables[idx].section = section;
  if (is_occupied !== undefined) db.tables[idx].is_occupied = is_occupied;
  saveDB(db);
  res.json(db.tables[idx]);
});

router.delete('/tables/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  db.tables = db.tables.filter(t => t.id !== req.params.id);
  // Also remove orders for this table
  const orderIds = db.orders.filter(o => o.table_id === req.params.id).map(o => o.id);
  db.orders = db.orders.filter(o => o.table_id !== req.params.id);
  db.orderItems = db.orderItems.filter(oi => !orderIds.includes(oi.order_id));
  saveDB(db);
  res.json({ message: 'Masa silindi' });
});

// ==================== ORDERS ====================

router.get('/tables/:tableId/orders', (req, res) => {
  const db = loadDB();
  const activeOrders = db.orders.filter(o => o.table_id === req.params.tableId && o.status === 'active');
  const result = activeOrders.map(order => {
    const items = db.orderItems
      .filter(oi => oi.order_id === order.id)
      .map(oi => {
        const product = db.products.find(p => p.id === oi.product_id);
        return {
          ...oi,
          product_name: product ? product.name : 'Bilinmeyen',
          product_price: product ? product.price : 0
        };
      });
    return { ...order, items };
  });
  res.json(result);
});

router.post('/tables/:tableId/orders', (req, res) => {
  const { items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Sipariş öğeleri gerekli' });
  const db = loadDB();
  const orderId = uuidv4();
  const order = {
    id: orderId,
    table_id: req.params.tableId,
    status: 'active',
    created_at: new Date().toISOString()
  };
  db.orders.push(order);

  // Mark table as occupied
  const tIdx = db.tables.findIndex(t => t.id === req.params.tableId);
  if (tIdx !== -1) db.tables[tIdx].is_occupied = true;

  for (const item of items) {
    db.orderItems.push({
      id: uuidv4(),
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity || 1,
      note: item.note || '',
      created_at: new Date().toISOString()
    });
  }
  saveDB(db);
  res.status(201).json({ message: 'Sipariş oluşturuldu', orderId });
});

router.post('/tables/transfer', (req, res) => {
  const { from_table_id, to_table_id } = req.body;
  if (!from_table_id || !to_table_id) return res.status(400).json({ error: 'Kaynak ve hedef masa gerekli' });
  const db = loadDB();
  const activeOrders = db.orders.filter(o => o.table_id === from_table_id && o.status === 'active');
  if (!activeOrders.length) return res.status(400).json({ error: 'Kaynak masada aktif sipariş yok' });

  activeOrders.forEach(o => { o.table_id = to_table_id; });

  // Update table occupancy
  const fromIdx = db.tables.findIndex(t => t.id === from_table_id);
  const toIdx = db.tables.findIndex(t => t.id === to_table_id);
  if (fromIdx !== -1) db.tables[fromIdx].is_occupied = false;
  if (toIdx !== -1) db.tables[toIdx].is_occupied = true;

  saveDB(db);
  res.json({ message: `${activeOrders.length} sipariş aktarıldı`, transferred: activeOrders.length });
});

router.put('/orders/:id/close', requireAdmin, (req, res) => {
  const { payments: paymentList } = req.body;
  // paymentList = [{ method: 'cash'|'card', amount: number }]
  if (!paymentList || !paymentList.length) {
    return res.status(400).json({ error: 'Ödeme bilgisi gerekli' });
  }

  const db = loadDB();
  if (!db.payments) db.payments = [];
  const idx = db.orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Sipariş bulunamadı' });

  // Calculate order total
  const orderItems = db.orderItems.filter(oi => oi.order_id === req.params.id);
  const orderTotal = orderItems.reduce((sum, oi) => {
    const product = db.products.find(p => p.id === oi.product_id);
    return sum + (product ? product.price * oi.quantity : 0);
  }, 0);

  db.orders[idx].status = 'closed';
  db.orders[idx].closed_at = new Date().toISOString();

  // Save each payment
  for (const pay of paymentList) {
    db.payments.push({
      id: uuidv4(),
      order_id: req.params.id,
      table_id: db.orders[idx].table_id,
      method: pay.method, // 'cash' or 'card'
      amount: pay.amount,
      order_total: orderTotal,
      created_at: new Date().toISOString()
    });
  }

  // Check if table has any other active orders
  const tableId = db.orders[idx].table_id;
  const remaining = db.orders.filter(o => o.table_id === tableId && o.status === 'active');
  if (!remaining.length) {
    const tIdx = db.tables.findIndex(t => t.id === tableId);
    if (tIdx !== -1) db.tables[tIdx].is_occupied = false;
  }

  saveDB(db);
  res.json({ message: 'Sipariş kapatıldı ve ödeme kaydedildi' });
});

// Get order total (for payment modal)
router.get('/orders/:id/total', requireAdmin, (req, res) => {
  const db = loadDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

  const items = db.orderItems.filter(oi => oi.order_id === req.params.id).map(oi => {
    const product = db.products.find(p => p.id === oi.product_id);
    return {
      ...oi,
      product_name: product ? product.name : 'Bilinmeyen',
      product_price: product ? product.price : 0
    };
  });

  const total = items.reduce((sum, i) => sum + (i.product_price * i.quantity), 0);
  res.json({ order_id: req.params.id, items, total });
});

// ==================== REPORTS ====================

router.get('/reports/payments', requireAdmin, (req, res) => {
  const db = loadDB();
  const payments = db.payments || [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Calculate week start (Monday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  // Calculate month start
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  function aggregate(filtered) {
    const cash = filtered.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0);
    const card = filtered.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0);
    return { cash: Math.round(cash * 100) / 100, card: Math.round(card * 100) / 100, total: Math.round((cash + card) * 100) / 100, count: filtered.length };
  }

  const daily = aggregate(payments.filter(p => p.created_at && p.created_at.startsWith(todayStr)));
  const weekly = aggregate(payments.filter(p => p.created_at && new Date(p.created_at) >= weekStart));
  const monthly = aggregate(payments.filter(p => p.created_at && new Date(p.created_at) >= monthStart));

  // Daily breakdown for the current month (for chart data)
  const dailyBreakdown = [];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= Math.min(now.getDate(), daysInMonth); d++) {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayPayments = payments.filter(p => p.created_at && p.created_at.startsWith(dateStr));
    if (dayPayments.length > 0) {
      const agg = aggregate(dayPayments);
      dailyBreakdown.push({ date: dateStr, day: d, ...agg });
    }
  }

  // Recent payments (last 50)
  const recent = payments
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50)
    .map(p => {
      const table = db.tables.find(t => t.id === p.table_id);
      return { ...p, table_name: table ? table.name : '?' };
    });

  res.json({ daily, weekly, monthly, dailyBreakdown, recent });
});

// ==================== MENU (Public, read-only) ====================

router.get('/menu', (req, res) => {
  const db = loadDB();
  const categories = db.categories.sort((a, b) => a.sort_order - b.sort_order);
  const products = db.products.filter(p => p.is_available).sort((a, b) => a.sort_order - b.sort_order);

  const menu = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id)
  }));
  res.json(menu);
});

module.exports = router;
