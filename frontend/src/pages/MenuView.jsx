import { useState, useEffect } from 'react';
import { getMenu } from '../api';

const FOOD_EMOJIS = {
  'Yiyecekler': '🍔',
  'İçecekler': '☕',
  'Meşrubatlar': '🥤',
  'Tatlılar': '🍰'
};

function ProductModal({ product, onClose }) {
  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{product.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-image">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{FOOD_EMOJIS[product._categoryName] || '🍽️'}</span>
            )}
          </div>
          {product.description && (
            <p className="modal-description">{product.description}</p>
          )}
          {product.ingredients && (
            <div className="modal-ingredients">
              <h4>İçindekiler</h4>
              <p>{product.ingredients}</p>
            </div>
          )}
          <div className="modal-price">
            {product.price} ₺
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuView() {
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      const data = await getMenu();
      setMenu(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    } catch (err) {
      console.error('Menü yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }

  const currentCategory = menu.find(c => c.id === activeCategory);
  const products = currentCategory ? currentCategory.products : [];

  if (loading) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">☕</div>
          <p>Menü yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '14px 12px 10px',
        marginBottom: '4px'
      }}>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '4px'
        }}>
          Menümüz
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Taze ve lezzetli ürünlerimizi keşfedin
        </p>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {menu.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="tab-icon">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>Bu kategoride henüz ürün yok</p>
        </div>
      ) : (
        <div className="products-grid" key={activeCategory}>
          {products.map(product => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => setSelectedProduct({ ...product, _categoryName: currentCategory.name })}
            >
              <div className="product-card-image">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{currentCategory.icon || '🍽️'}</span>
                )}
              </div>
              <div className="product-card-body">
                <div className="product-card-name">{product.name}</div>
                <div className="product-card-desc">{product.description}</div>
                <div className="product-card-footer">
                  <span className="product-price">{product.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
