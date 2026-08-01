import React, { useState } from 'react';
import './Login.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from "../api/axios";

const SifreSifirla = () => {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [yeniSifre, setYeniSifre] = useState('');
  const [mesaj, setMesaj] = useState(null);
  const [basarili, setBasarili] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMesaj(null);
    try {
      const response = await api.post("password-reset/confirm/", { uid, token, yeni_sifre: yeniSifre });
      setBasarili(true);
      setMesaj(response.data.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setMesaj(error.response?.data?.error || "Bir hata oluştu.");
    }
  };

  if (!uid || !token) {
    return (
      <div className="login-container">
        <main className="login-main">
          <div className="login-card">
            <p className="error-text">Geçersiz sıfırlama bağlantısı.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="login-container">
      <main className="login-main">
        <div className="login-card">
          <div className="card-header">
            <div className="logo-icon-large">A</div>
            <h2>Yeni Şifre Belirle</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>Yeni Şifre</label>
              <input type="password" value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} required />
            </div>

            {mesaj && <p className={basarili ? "" : "error-text"}>{mesaj}</p>}

            <button type="submit" className="btn-primary">Şifreyi Güncelle →</button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SifreSifirla;