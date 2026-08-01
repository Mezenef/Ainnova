import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";

const Dogrulama = () => {
  const [kod, setKod] = useState('');
  const [hata, setHata] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata(null);
    const preAuthToken = sessionStorage.getItem("pre_auth_token");
    if (!preAuthToken) {
      setHata("Doğrulama oturumu bulunamadı, tekrar giriş yap.");
      return;
    }
    try {
      const response = await api.post("totp/verify-login/", {
        pre_auth_token: preAuthToken,
        code: kod,
      });
      sessionStorage.removeItem("pre_auth_token");
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      navigate('/dashboard');
    } catch (error) {
      setHata(error.response?.data?.error || "Kod geçersiz.");
    }
  };

  return (
    <div className="login-container">
      <main className="login-main">
        <div className="login-card">
          <div className="card-header">
            <div className="logo-icon-large">A</div>
            <h2>İki Faktörlü Doğrulama</h2>
            <p>Authenticator uygulamandaki 6 haneli kodu gir.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>Doğrulama Kodu</label>
              <input type="text" value={kod} onChange={(e) => setKod(e.target.value)} required />
            </div>

            {hata && <p className="error-text">{hata}</p>}

            <button type="submit" className="btn-primary">Doğrula →</button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Dogrulama;