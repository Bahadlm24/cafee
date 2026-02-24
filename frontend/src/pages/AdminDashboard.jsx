import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ImageCropper from '../components/ImageCropper';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getProducts, createProduct, updateProduct, deleteProduct, uploadImage,
  getTables, createTable, updateTable, deleteTable,
  getTableOrders, createOrder, transferOrders, closeOrder, getOrderTotal,
  getPaymentReports
} from '../api';

// ========== Category Management ==========
function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', icon: '🍽️', sort_order: 0 });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setCategories(await getCategories()); } catch (e) { toast.error(e.message); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        toast.success('Kategori güncellendi');
      } else {
        await createCategory(form);
        toast.success('Kategori eklendi');
      }
      setForm({ name: '', icon: '🍽️', sort_order: 0 });
      setEditingId(null);
      load();
    } catch (e) { toast.error(e.message); }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon, sort_order: cat.sort_order });
  }

  async function handleDelete(id) {
    if (!confirm('Bu kategori ve altındaki ürünler silinecek. Emin misiniz?')) return;
    try {
      await deleteCategory(id);
      toast.success('Kategori silindi');
      load();
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div>
      <div className="admin-header">
        <h2>📂 Kategoriler</h2>
      </div>

      <form onSubmit={handleSubmit} className="card mb-4" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
          <label>Kategori Adı</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ör: Yiyecekler" required />
        </div>
        <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
          <label>İkon</label>
          <input className="form-input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
        </div>
        <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
          <label>Sıra</label>
          <input className="form-input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
        </div>
        <button type="submit" className="btn btn-primary">{editingId ? 'Güncelle' : 'Ekle'}</button>
        {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm({ name: '', icon: '🍽️', sort_order: 0 }); }}>İptal</button>}
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>İkon</th>
            <th>Ad</th>
            <th>Sıra</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td style={{ fontSize: '1.3rem' }}>{cat.icon}</td>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</td>
              <td>{cat.sort_order}</td>
              <td>
                <div className="admin-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(cat)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat.id)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Henüz kategori yok</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ========== Product Management ==========
function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', name: '', description: '', ingredients: '', price: 0, image_url: '', is_available: true, sort_order: 0 });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      setProducts(p);
      setCategories(c);
    } catch (e) { toast.error(e.message); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct(editingId, form);
        toast.success('Ürün güncellendi');
      } else {
        await createProduct(form);
        toast.success('Ürün eklendi');
      }
      resetForm();
      load();
    } catch (e) { toast.error(e.message); }
  }

  function resetForm() {
    setForm({ category_id: '', name: '', description: '', ingredients: '', price: 0, image_url: '', is_available: true, sort_order: 0 });
    setEditingId(null);
    setShowForm(false);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      category_id: p.category_id,
      name: p.name,
      description: p.description,
      ingredients: p.ingredients,
      price: p.price,
      image_url: p.image_url || '',
      is_available: p.is_available,
      sort_order: p.sort_order
    });
    setImagePreview(p.image_url || '');
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Sadece JPG, PNG, GIF ve WebP formatları desteklenir');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu en fazla 5MB olmalıdır');
      return;
    }

    // Read file and open cropper
    const reader = new FileReader();
    reader.onloadend = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleCropDone(croppedFile) {
    setCropSrc(null);
    setUploading(true);
    try {
      const result = await uploadImage(croppedFile);
      setForm(prev => ({ ...prev, image_url: result.url }));
      setImagePreview(result.url);
      toast.success('Görsel kırpıldı ve yüklendi');
    } catch (err) {
      toast.error(err.message);
      setImagePreview('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeImage() {
    setForm(prev => ({ ...prev, image_url: '' }));
    setImagePreview('');
    setCropSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(id) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await deleteProduct(id);
      toast.success('Ürün silindi');
      load();
    } catch (e) { toast.error(e.message); }
  }

  function getCategoryName(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '?';
  }

  return (
    <div>
      <div className="admin-header">
        <h2>🛒 Ürünler</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Kapat' : '+ Yeni Ürün'}
        </button>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="card mb-4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="form-group">
              <label>Kategori</label>
              <select className="form-input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Seçiniz...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Ürün Adı</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ör: Klasik Burger" required />
            </div>
            <div className="form-group">
              <label>Fiyat (₺)</label>
              <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label>Sıra</label>
              <input className="form-input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="form-group">
            <label>Açıklama</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ürün açıklaması..." />
          </div>
          <div className="form-group">
            <label>İçindekiler</label>
            <textarea className="form-input" value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })} placeholder="Malzemeler..." />
          </div>
          <div className="form-group">
            <label>Ürün Görseli</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '120px',
                  height: '90px',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px dashed var(--border-light)',
                  background: 'var(--bg-input)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0
                }}
              >
                {uploading ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yükleniyor...</span>
                ) : imagePreview ? (
                  <img src={imagePreview} alt="Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <span style={{ fontSize: '1.5rem', marginBottom: '2px' }}>📷</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Görsel Ekle</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {imagePreview && (
                <button type="button" className="btn btn-danger btn-sm" onClick={removeImage} style={{ marginTop: '4px' }}>
                  🗑️ Görseli Kaldır
                </button>
              )}
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} />
              <span style={{ textTransform: 'none', fontSize: '0.9rem' }}>Menüde Göster</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary">{editingId ? 'Güncelle' : 'Ekle'}</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>İptal</button>
          </div>
        </form>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Kategori</th>
              <th>Fiyat</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🍽️</span>
                  )}
                  {p.name}
                </td>
                <td>{getCategoryName(p.category_id)}</td>
                <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{p.price} ₺</td>
                <td>
                  <span className={`badge ${p.is_available ? 'badge-success' : 'badge-danger'}`}>
                    {p.is_available ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Henüz ürün yok</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Image Cropper Modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onCropDone={handleCropDone}
          onCancel={() => { setCropSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
        />
      )}
    </div>
  );
}

// ========== Table Management ==========
function TableManager() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ name: '', section: 'indoor' });
  const [editingId, setEditingId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orders, setOrders] = useState([]);
  const [transferTarget, setTransferTarget] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [cart, setCart] = useState([]);
  const [paymentModal, setPaymentModal] = useState(null); // { orderId, total, items }
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'card', 'split'
  const [splitCash, setSplitCash] = useState(0);
  const [splitCard, setSplitCard] = useState(0);

  useEffect(() => { load(); loadProducts(); }, []);

  async function load() {
    try { setTables(await getTables()); } catch (e) { toast.error(e.message); }
  }

  async function loadProducts() {
    try {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      setAllProducts(p.filter(pr => pr.is_available));
      setAllCategories(c);
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTable(editingId, form);
        toast.success('Masa güncellendi');
      } else {
        await createTable(form);
        toast.success('Masa eklendi');
      }
      setForm({ name: '', section: 'indoor' });
      setEditingId(null);
      load();
    } catch (e) { toast.error(e.message); }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setForm({ name: t.name, section: t.section });
  }

  async function handleDelete(id) {
    if (!confirm('Bu masayı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteTable(id);
      toast.success('Masa silindi');
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function viewOrders(table) {
    setSelectedTable(table);
    setShowAddOrder(false);
    setCart([]);
    try {
      const data = await getTableOrders(table.id);
      setOrders(data);
    } catch (e) { toast.error(e.message); }
  }

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function updateCartQty(productId, delta) {
    setCart(prev => prev.map(i => {
      if (i.product_id === productId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  }

  async function submitOrder() {
    if (cart.length === 0 || !selectedTable) return;
    try {
      const items = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
      await createOrder(selectedTable.id, items);
      toast.success('Sipariş masaya eklendi');
      setCart([]);
      setShowAddOrder(false);
      viewOrders(selectedTable);
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function handleTransfer() {
    if (!transferTarget || !selectedTable) return;
    try {
      const result = await transferOrders(selectedTable.id, transferTarget);
      toast.success(result.message);
      setShowTransfer(false);
      setTransferTarget('');
      setSelectedTable(null);
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function openPaymentModal(orderId) {
    try {
      const data = await getOrderTotal(orderId);
      setPaymentModal({ orderId, total: data.total, items: data.items });
      setPaymentMethod('cash');
      setSplitCash(data.total);
      setSplitCard(0);
    } catch (e) { toast.error(e.message); }
  }

  async function handlePayment() {
    if (!paymentModal) return;
    let payments;
    if (paymentMethod === 'cash') {
      payments = [{ method: 'cash', amount: paymentModal.total }];
    } else if (paymentMethod === 'card') {
      payments = [{ method: 'card', amount: paymentModal.total }];
    } else {
      // split
      if (Math.abs((splitCash + splitCard) - paymentModal.total) > 0.01) {
        toast.error('Nakit ve kart toplamı sipariş tutarına eşit olmalıdır');
        return;
      }
      payments = [];
      if (splitCash > 0) payments.push({ method: 'cash', amount: splitCash });
      if (splitCard > 0) payments.push({ method: 'card', amount: splitCard });
    }
    try {
      await closeOrder(paymentModal.orderId, payments);
      toast.success('Sipariş kapatıldı ve ödeme kaydedildi');
      setPaymentModal(null);
      if (selectedTable) viewOrders(selectedTable);
      load();
    } catch (e) { toast.error(e.message); }
  }

  const indoorTables = tables.filter(t => t.section === 'indoor');
  const gardenTables = tables.filter(t => t.section === 'garden');

  return (
    <div>
      <div className="admin-header">
        <h2>🪑 Masa Yönetimi</h2>
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="card mb-4" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: '1', minWidth: '150px', marginBottom: 0 }}>
          <label>Masa Adı</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ör: Masa 6" required />
        </div>
        <div className="form-group" style={{ minWidth: '150px', marginBottom: 0 }}>
          <label>Bölüm</label>
          <select className="form-input" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
            <option value="indoor">🏠 İç Mekan</option>
            <option value="garden">🌿 Bahçe</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">{editingId ? 'Güncelle' : 'Ekle'}</button>
        {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm({ name: '', section: 'indoor' }); }}>İptal</button>}
      </form>

      {/* Indoor Tables */}
      {indoorTables.length > 0 && (
        <>
          <div className="section-title">
            <span className="section-icon">🏠</span> İç Mekan
          </div>
          <div className="tables-grid">
            {indoorTables.map(t => (
              <div key={t.id} className={`table-card ${t.is_occupied ? 'occupied' : ''}`} onClick={() => viewOrders(t)}>
                <div className="table-badge"></div>
                <div className="table-icon">🪑</div>
                <div className="table-name">{t.name}</div>
                <div className="table-status">{t.is_occupied ? 'Dolu' : 'Boş'}</div>
                <div className="admin-actions" style={{ marginTop: '8px', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(t)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Garden Tables */}
      {gardenTables.length > 0 && (
        <>
          <div className="section-title">
            <span className="section-icon">🌿</span> Bahçe
          </div>
          <div className="tables-grid">
            {gardenTables.map(t => (
              <div key={t.id} className={`table-card ${t.is_occupied ? 'occupied' : ''}`} onClick={() => viewOrders(t)}>
                <div className="table-badge"></div>
                <div className="table-icon">🌳</div>
                <div className="table-name">{t.name}</div>
                <div className="table-status">{t.is_occupied ? 'Dolu' : 'Boş'}</div>
                <div className="admin-actions" style={{ marginTop: '8px', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(t)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tables.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🪑</div>
          <p>Henüz masa eklenmemiş</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedTable && (
        <div className="modal-overlay" onClick={() => { setSelectedTable(null); setShowTransfer(false); setShowAddOrder(false); setCart([]); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedTable.name} - Siparişler</h3>
              <button className="modal-close" onClick={() => { setSelectedTable(null); setShowTransfer(false); setShowAddOrder(false); setCart([]); }}>✕</button>
            </div>
            <div className="modal-body">
              {/* Existing Orders */}
              {orders.length === 0 && !showAddOrder && (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-icon">📋</div>
                  <p>Bu masada aktif sipariş yok</p>
                </div>
              )}

              {orders.length > 0 && (
                <>
                  {orders.map(order => (
                    <div key={order.id} className="card" style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="badge badge-success">Aktif</span>
                        <button className="btn btn-danger btn-sm" onClick={() => openPaymentModal(order.id)}>💳 Ödeme Al</button>
                      </div>
                      {order.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                          <span>{item.product_name} x{item.quantity}</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{(item.product_price * item.quantity)} ₺</span>
                        </div>
                      ))}
                      <div style={{ textAlign: 'right', marginTop: '8px', fontWeight: 700, color: 'var(--primary)' }}>
                        Toplam: {order.items.reduce((sum, i) => sum + (i.product_price * i.quantity), 0)} ₺
                      </div>
                    </div>
                  ))}

                  {/* Transfer Button */}
                  <button className="btn btn-success w-full" style={{ marginTop: '8px' }} onClick={() => setShowTransfer(!showTransfer)}>
                    🔄 Siparişleri Başka Masaya Aktar
                  </button>

                  {showTransfer && (
                    <div className="card" style={{ marginTop: '12px' }}>
                      <div className="form-group">
                        <label>Hedef Masa</label>
                        <select className="form-input" value={transferTarget} onChange={e => setTransferTarget(e.target.value)}>
                          <option value="">Masa seçin...</option>
                          {tables.filter(t => t.id !== selectedTable.id).map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.section === 'garden' ? 'Bahçe' : 'İç Mekan'}) {t.is_occupied ? '(Dolu)' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <button className="btn btn-primary w-full" onClick={handleTransfer} disabled={!transferTarget}>
                        Aktarımı Onayla
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Add Order Section */}
              <button
                className="btn btn-primary w-full"
                style={{ marginTop: '12px' }}
                onClick={() => setShowAddOrder(!showAddOrder)}
              >
                {showAddOrder ? '✕ Kapat' : '➕ Sipariş Ekle'}
              </button>

              {showAddOrder && (
                <div style={{ marginTop: '12px' }}>
                  {/* Product List by Category */}
                  {allCategories.map(cat => {
                    const catProducts = allProducts.filter(p => p.category_id === cat.id);
                    if (catProducts.length === 0) return null;
                    return (
                      <div key={cat.id} style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                          {cat.icon} {cat.name}
                        </div>
                        {catProducts.map(product => {
                          const inCart = cart.find(i => i.product_id === product.id);
                          return (
                            <div
                              key={product.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 0',
                                borderBottom: '1px solid var(--border)',
                                fontSize: '0.85rem',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{product.price} ₺</div>
                              </div>
                              {inCart ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                  <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.85rem' }} onClick={() => updateCartQty(product.id, -1)}>−</button>
                                  <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{inCart.quantity}</span>
                                  <button className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: '0.85rem' }} onClick={() => updateCartQty(product.id, 1)}>+</button>
                                  <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px', fontSize: '0.7rem', marginLeft: '2px' }} onClick={() => removeFromCart(product.id)}>✕</button>
                                </div>
                              ) : (
                                <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => addToCart(product)}>+ Ekle</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Cart Summary & Submit */}
                  {cart.length > 0 && (
                    <div className="card" style={{ marginTop: '12px', background: 'var(--bg-surface)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>🧾 Sipariş Özeti</div>
                      {cart.map(item => (
                        <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0' }}>
                          <span>{item.name} x{item.quantity}</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{(item.price * item.quantity).toFixed(2)} ₺</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        Toplam: {cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)} ₺
                      </div>
                      <button className="btn btn-success w-full" style={{ marginTop: '10px' }} onClick={submitOrder}>
                        ✅ Siparişi Onayla
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">💳 Ödeme Al</h3>
              <button className="modal-close" onClick={() => setPaymentModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Order items summary */}
              <div className="card" style={{ marginBottom: '16px' }}>
                {paymentModal.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                    <span>{item.product_name} x{item.quantity}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{(item.product_price * item.quantity).toFixed(2)} ₺</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                  Toplam: {paymentModal.total.toFixed(2)} ₺
                </div>
              </div>

              {/* Payment Method Selection */}
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Ödeme Yöntemi</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => { setPaymentMethod('cash'); setSplitCash(paymentModal.total); setSplitCard(0); }}
                >
                  💵 Nakit
                </button>
                <button
                  className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => { setPaymentMethod('card'); setSplitCash(0); setSplitCard(paymentModal.total); }}
                >
                  💳 Kart
                </button>
                <button
                  className={`btn ${paymentMethod === 'split' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => { setPaymentMethod('split'); setSplitCash(0); setSplitCard(0); }}
                >
                  ✂️ Bölüştür
                </button>
              </div>

              {/* Split Payment Inputs */}
              {paymentMethod === 'split' && (
                <div className="card" style={{ marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label>💵 Nakit Tutar (₺)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={splitCash}
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0;
                        setSplitCash(v);
                        setSplitCard(Math.max(0, Math.round((paymentModal.total - v) * 100) / 100));
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <label>💳 Kart Tutar (₺)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={splitCard}
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0;
                        setSplitCard(v);
                        setSplitCash(Math.max(0, Math.round((paymentModal.total - v) * 100) / 100));
                      }}
                    />
                  </div>
                  {Math.abs((splitCash + splitCard) - paymentModal.total) > 0.01 && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', textAlign: 'center' }}>
                      ⚠️ Toplam {(splitCash + splitCard).toFixed(2)} ₺ — sipariş tutarı: {paymentModal.total.toFixed(2)} ₺
                    </div>
                  )}
                </div>
              )}

              <button className="btn btn-success w-full" style={{ padding: '12px', fontSize: '1rem' }} onClick={handlePayment}>
                ✅ Ödemeyi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Report Manager ==========
function ReportManager() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await getPaymentReports();
      setReport(data);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <p>Raporlar yükleniyor...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <p>Rapor verisi yüklenemedi</p>
      </div>
    );
  }

  const formatMoney = (v) => (v || 0).toFixed(2);

  return (
    <div>
      <div className="admin-header">
        <h2>📊 Raporlar</h2>
        <button className="btn btn-secondary btn-sm" onClick={loadReports}>🔄 Yenile</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Daily */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>📅 Bugün</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>{formatMoney(report.daily.total)} ₺</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span>💵 Nakit: <strong>{formatMoney(report.daily.cash)} ₺</strong></span>
            <span>💳 Kart: <strong>{formatMoney(report.daily.card)} ₺</strong></span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{report.daily.count} işlem</div>
        </div>

        {/* Weekly */}
        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>📆 Bu Hafta</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginBottom: '12px' }}>{formatMoney(report.weekly.total)} ₺</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span>💵 Nakit: <strong>{formatMoney(report.weekly.cash)} ₺</strong></span>
            <span>💳 Kart: <strong>{formatMoney(report.weekly.card)} ₺</strong></span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{report.weekly.count} işlem</div>
        </div>

        {/* Monthly */}
        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>🗓️ Bu Ay</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6', marginBottom: '12px' }}>{formatMoney(report.monthly.total)} ₺</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span>💵 Nakit: <strong>{formatMoney(report.monthly.cash)} ₺</strong></span>
            <span>💳 Kart: <strong>{formatMoney(report.monthly.card)} ₺</strong></span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{report.monthly.count} işlem</div>
        </div>
      </div>

      {/* Daily Breakdown */}
      {report.dailyBreakdown.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>📈 Günlük Dağılım (Bu Ay)</h3>
          <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>💵 Nakit</th>
                  <th>💳 Kart</th>
                  <th>Toplam</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {report.dailyBreakdown.map(day => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{formatMoney(day.cash)} ₺</td>
                    <td>{formatMoney(day.card)} ₺</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(day.total)} ₺</td>
                    <td>{day.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Recent Payments */}
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>📝 Son Ödemeler</h3>
      {report.recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p>Henüz ödeme yok</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tarih/Saat</th>
                <th>Masa</th>
                <th>Yöntem</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {report.recent.map(p => (
                <tr key={p.id}>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(p.created_at).toLocaleString('tr-TR')}</td>
                  <td>{p.table_name}</td>
                  <td>
                    <span className={`badge ${p.method === 'cash' ? 'badge-success' : 'badge-primary'}`}>
                      {p.method === 'cash' ? '💵 Nakit' : '💳 Kart'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatMoney(p.amount)} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ========== Main Admin Dashboard ==========
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('categories');

  const tabs = [
    { id: 'categories', label: 'Kategoriler', icon: '📂' },
    { id: 'products', label: 'Ürünler', icon: '🛒' },
    { id: 'tables', label: 'Masalar', icon: '🪑' },
    { id: 'reports', label: 'Raporlar', icon: '📊' },
  ];

  return (
    <div className="page-content">
      <div className="admin-grid">
        <div className="admin-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="admin-main">
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'tables' && <TableManager />}
          {activeTab === 'reports' && <ReportManager />}
        </div>
      </div>
    </div>
  );
}
