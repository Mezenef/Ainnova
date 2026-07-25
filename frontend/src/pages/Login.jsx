import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hata, setHata] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata(null);
    try {
      const response = await api.post("token/", { username: email, password: password });
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("access", response.data.access);
      storage.setItem("refresh", response.data.refresh);
      navigate('/dashboard');
    } catch (error) {
      setHata("E-posta veya şifre hatalı!");
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo-area">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="back-to-dashboard">
            ← Ana ekrana dön
          </a>
        </div>
        <div className="lang-select">
          <span>TR ⌄</span>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="card-header">
            <div className="logo-icon-large">A</div>
            <h2>Ainnova</h2>
            <h3>Content Studio</h3>
            <p>Akıllı içerik üretimi, güçlü marka iletişimi.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>E-posta</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder="E-posta"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Şifre</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <span className="input-icon-right" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                  {showPassword ? "Gizle" : "Göster"}
                </span>
              </div>
            </div>

            {hata && <p className="error-text">{hata}</p>}

            <div className="form-actions">
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Beni hatırla
              </label>
              <a href="#" className="forgot-pass" onClick={(e) => { e.preventDefault(); navigate('/sifremi-unuttum'); }}>
                Şifreni mi unuttun?
              </a>
            </div>

            <button type="submit" className="btn-primary">
              Giriş yap →
            </button>

            <p className="signup-text">
              Hesabın yok mu?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/kayit'); }}>Kayıt ol</a>
            </p>
          </form>
        </div>
      </main>

      <footer className="login-footer">
        © 2026 Ainnova Digital Marketing & Advertising. Tüm hakları saklıdır.
      </footer>
    </div>
  );
};

export default Login;