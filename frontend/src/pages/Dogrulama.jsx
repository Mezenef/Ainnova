import React, { useState } from 'react';
import './Dogrulama.css';

const Dogrulama = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);

    // Otomatik olarak bir sonraki kutuya geç
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  return (
    <div className="login-container"> {/* Login'deki aynı arka planı kullanıyoruz */}
      <header className="login-header">
        <div className="logo-area">
          <div className="logo-icon-small">A</div>
          <span className="logo-text"><strong>Ainnova</strong> Content Studio</span>
        </div>
        <div className="lang-select">
          <span>🌐 TR ⌄</span>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card auth-card">
          <div className="auth-icon">
            <span className="mail-icon">✉️</span>
          </div>
          <h2>E-postanı kontrol et</h2>
          <p className="auth-subtitle">
            Doğrulama kodunu aşağıdaki e-posta adresine gönderdik.<br/>
            <strong>ornek@ainnova.com</strong>
          </p>

          <div className="code-input-section">
            <label>Doğrulama kodunu gir</label>
            <div className="code-inputs">
              {code.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            <span className="code-hint">Kod 6 haneli bir sayıdır.</span>
          </div>

          <button className="btn-primary w-100">
            Doğrula →
          </button>

          <div className="resend-timer">
            ⏱ Kodu tekrar gönderebilirsin: <strong>00:45</strong>
          </div>

          <div className="divider"><span>veya</span></div>

          <button className="btn-secondary w-100">
            🔄 Kodu tekrar gönder
          </button>
        </div>
      </main>

      <div className="back-to-login">
        <a href="#">← Giriş sayfasına dön</a>
      </div>
    </div>
  );
};

export default Dogrulama;