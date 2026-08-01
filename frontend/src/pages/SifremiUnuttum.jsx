import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";

const SifremiUnuttum = () => {
  const [email, setEmail] = useState('');
  const [mesaj, setMesaj] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMesaj(null);
    try {
      const response = await api.post("password-reset/", { email });
      setMesaj(response.data.message);
    } catch (error) {
      setMesaj("Bir hata oluştu.");
    }
  };

  return (
    <div className="login-container">
      <main className="login-main">
        <div className="login-card">
          <div className="card-header">
            <div className="logo-icon-large">A</div>
            <h2>Şifremi Unuttum</h2>
            <p>Kayıtlı e-postanı gir, sıfırlama linki gönderelim.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>E-posta</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {mesaj && <p>{mesaj}</p>}

            <button type="submit" className="btn-primary">Sıfırlama Linki Gönder →</button>

            <p className="signup-text">
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>← Giriş sayfasına dön</a>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SifremiUnuttum;