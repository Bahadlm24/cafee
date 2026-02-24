import { useState } from 'react';
import toast from 'react-hot-toast';
import { login, setToken } from '../api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(username, password);
      setToken(result.token);
      toast.success('Giriş başarılı');
      onLogin();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img
            src="/logo.png"
            alt="My Cookies"
            className="login-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2>Yönetim Paneli</h2>
          <p>Devam etmek için giriş yapın</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Kullanıcı Adı</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adı"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Giriş yapılıyor...' : '🔐 Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
