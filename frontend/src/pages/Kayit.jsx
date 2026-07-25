import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import api from "../api/axios";

const Kayit = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mesaj, setMesaj] = useState(null);
  const [basarili, setBasarili] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMesaj(null);
    try {
      await api.post("register/", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      setBasarili(true);
      setMesaj("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setMesaj(error.response?.data?.error || "Kayıt başarısız.");
    }
  };

  return (
    <div className="login-container">
      <main className="login-main">
        <div className="login-card">
          <div className="card-header">
            <div className="logo-icon-large">A</div>
            <h2>Ainnova</h2>
            <h3>Content Studio</h3>
            <p>Yeni bir hesap oluştur.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>Ad</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="off" />
            </div>
            <div className="input-group">
              <label>Soyad</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="off" />
            </div>
            <div className="input-group">
              <label>E-posta</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
            </div>
            <div className="input-group">
              <label>Şifre</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>

            {mesaj && <p className={basarili ? "" : "error-text"}>{mesaj}</p>}

            <button type="submit" className="btn-primary">Kayıt ol →</button>

            <p className="signup-text">
              Zaten hesabın var mı?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Giriş yap</a>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Kayit;