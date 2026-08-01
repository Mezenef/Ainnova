import React, { useState, useEffect } from 'react';
import './Ayarlar.css';
import { useTheme } from '../context/ThemeContext';
import api from "../api/axios";

const Ayarlar = () => {
  const [activeTab, setActiveTab] = useState('profil');

  const [totpSetup, setTotpSetup] = useState(null);
  const [totpKod, setTotpKod] = useState('');
  const [totpMesaj, setTotpMesaj] = useState(null);
  const [totpAktif, setTotpAktif] = useState(false);
  const [backupKodlar, setBackupKodlar] = useState([]);
  const [disableSifre, setDisableSifre] = useState('');
  const [disableKod, setDisableKod] = useState('');

  const {
    isDarkMode, setIsDarkMode,
    accentColor: vurguRengi, setAccentColor: handleVurguRengiDegis,
    fontFamily: yaziTipi, setFontFamily: handleYaziTipiDegis,
    colorSaturation: renkYogunlugu, setColorSaturation: handleRenkYogunluguDegis,
  } = useTheme();

  const [profil, setProfil] = useState({ username: '', email: '', first_name: '', last_name: '' });
  const [profilLoading, setProfilLoading] = useState(true);
  const [profilKaydediliyor, setProfilKaydediliyor] = useState(false);
  const [profilMesaj, setProfilMesaj] = useState(null);

  const [bildirimler, setBildirimler] = useState({
    email_notifications: true, weekly_report: true, push_notifications: false, ai_tips: true, content_ready: true,
  });
  const [bildirimLoading, setBildirimLoading] = useState(true);

  const [eskiSifre, setEskiSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [sifreMesaj, setSifreMesaj] = useState(null);
  const [sifreKaydediliyor, setSifreKaydediliyor] = useState(false);

  useEffect(() => {
    const getProfil = async () => {
      try {
        const response = await api.get("me/");
        setProfil(response.data);
        setTotpAktif(!!response.data.is_totp_enabled);
      } catch (err) {
        console.error("Profil alınamadı:", err);
      } finally {
        setProfilLoading(false);
      }
    };
    getProfil();
  }, []);

  useEffect(() => {
    const getBildirimler = async () => {
      try {
        const response = await api.get("notifications/preferences/");
        setBildirimler(response.data);
      } catch (err) {
        console.error("Bildirim tercihleri alınamadı:", err);
      } finally {
        setBildirimLoading(false);
      }
    };
    getBildirimler();
  }, []);

  const handleProfilChange = (e) => {
    setProfil({ ...profil, [e.target.name]: e.target.value });
  };

  const handleTotpBaslat = async () => {
    try {
      const response = await api.post("totp/setup/");
      setTotpSetup(response.data);
      setTotpMesaj(null);
    } catch (err) {
      setTotpMesaj("2FA kurulumu başlatılamadı.");
    }
  };

  const handleTotpEtkinlestir = async () => {
    try {
      const response = await api.post("totp/enable/", { code: totpKod });
      setTotpAktif(true);
      setBackupKodlar(response.data.backup_codes);
      setTotpSetup(null);
      setTotpKod('');
      setTotpMesaj("2FA aktifleştirildi! Yedek kodlarını güvenli bir yere kaydet.");
    } catch (err) {
      setTotpMesaj(err.response?.data?.error || "Kod geçersiz.");
    }
  };

  const handleTotpDevreDisi = async () => {
    try {
      await api.post("totp/disable/", { password: disableSifre, code: disableKod });
      setTotpAktif(false);
      setDisableSifre('');
      setDisableKod('');
      setBackupKodlar([]);
      setTotpMesaj("2FA devre dışı bırakıldı.");
    } catch (err) {
      setTotpMesaj(err.response?.data?.error || "İşlem başarısız.");
    }
  };

  const handleProfilKaydet = async () => {
    setProfilKaydediliyor(true);
    setProfilMesaj(null);
    try {
      const response = await api.put("me/", {
        first_name: profil.first_name,
        last_name: profil.last_name,
        email: profil.email,
      });
      setProfil(response.data);
      setProfilMesaj("Profil güncellendi.");
    } catch (err) {
      console.error("Profil güncellenemedi:", err.response?.data || err);
      setProfilMesaj("Güncelleme başarısız.");
    } finally {
      setProfilKaydediliyor(false);
    }
  };

  const handleBildirimToggle = async (alan) => {
    const yeniDeger = { ...bildirimler, [alan]: !bildirimler[alan] };
    setBildirimler(yeniDeger);
    try {
      const response = await api.put("notifications/preferences/", yeniDeger);
      setBildirimler(response.data);
    } catch (err) {
      console.error("Bildirim tercihi güncellenemedi:", err);
      setBildirimler(bildirimler);
    }
  };

  const handleSifreKaydet = async () => {
    setSifreMesaj(null);
    if (!eskiSifre || !yeniSifre || !yeniSifreTekrar) {
      setSifreMesaj("Tüm alanları doldurun.");
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setSifreMesaj("Yeni şifreler eşleşmiyor.");
      return;
    }
    setSifreKaydediliyor(true);
    try {
      const response = await api.post("me/change-password/", { eski_sifre: eskiSifre, yeni_sifre: yeniSifre });
      setSifreMesaj(response.data.message || "Şifre güncellendi.");
      setEskiSifre(''); setYeniSifre(''); setYeniSifreTekrar('');
    } catch (err) {
      setSifreMesaj(err.response?.data?.error || "Şifre güncellenemedi.");
    } finally {
      setSifreKaydediliyor(false);
    }
  };

  const renkler = ['#4a47a3', '#0a66c2', '#2ea05b', '#f26d21', '#d66685', '#1a1a1a'];

  const bildirimListesi = [
    { key: 'email_notifications', icon: <svg viewBox="0 0 24 24" className="notif-svg-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>, label: 'E-posta bildirimleri' },
    { key: 'weekly_report', icon: <svg viewBox="0 0 24 24" className="notif-svg-icon"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>, label: 'Haftalık performans raporu' },
    { key: 'push_notifications', icon: <svg viewBox="0 0 24 24" className="notif-svg-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>, label: 'Tarayıcı (Push) bildirimleri' },
    { key: 'ai_tips', icon: <svg viewBox="0 0 24 24" className="notif-svg-icon"><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="2" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="22"></line><line x1="2" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line><line x1="17.66" y1="4.93" x2="19.07" y2="6.34"></line></svg>, label: 'AI önerileri ve ipuçları' },
    { key: 'content_ready', icon: <svg viewBox="0 0 24 24" className="notif-svg-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>, label: 'İçerik hazır olduğunda' },
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Ayarlar</h1>
        <p>Hesabınızı ve uygulama tercihlerinizi yönetin.</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <button className={`settings-tab ${activeTab === 'profil' ? 'active' : ''}`} onClick={() => setActiveTab('profil')}>
            <svg viewBox="0 0 24 24" className="tab-svg-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Profil
          </button>
          <button className={`settings-tab ${activeTab === 'gorunum' ? 'active' : ''}`} onClick={() => setActiveTab('gorunum')}>
            <svg viewBox="0 0 24 24" className="tab-svg-icon"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><line x1="2" y1="12" x2="22" y2="12"></line></svg> Görünüm
          </button>
          <button className={`settings-tab ${activeTab === 'bildirimler' ? 'active' : ''}`} onClick={() => setActiveTab('bildirimler')}>
            <svg viewBox="0 0 24 24" className="tab-svg-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> Bildirimler
          </button>
          <button className={`settings-tab ${activeTab === 'guvenlik' ? 'active' : ''}`} onClick={() => setActiveTab('guvenlik')}>
            <svg viewBox="0 0 24 24" className="tab-svg-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Güvenlik
          </button>
        </aside>

        <div className="settings-content">
          {activeTab === 'profil' && (
            <div className="settings-card-group">
              <div className="settings-card profile-form-card">
                <h3>Profil Bilgileri</h3>
                <p className="card-subtitle">Kişisel bilgilerinizi güncelleyin.</p>

                {profilLoading ? (
                  <p>Yükleniyor...</p>
                ) : (
                  <>
                    <div className="form-grid">
                      <div className="input-group">
                        <label>Ad</label>
                        <input type="text" name="first_name" value={profil.first_name || ''} onChange={handleProfilChange} />
                      </div>
                      <div className="input-group">
                        <label>Soyad</label>
                        <input type="text" name="last_name" value={profil.last_name || ''} onChange={handleProfilChange} />
                      </div>
                      <div className="input-group">
                        <label>E-posta</label>
                        <input type="email" name="email" value={profil.email || ''} onChange={handleProfilChange} />
                      </div>
                    </div>
                    <div className="form-footer">
                      <button className="btn-primary" onClick={handleProfilKaydet} disabled={profilKaydediliyor}>
                        {profilKaydediliyor ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                      {profilMesaj && <span style={{ marginLeft: '10px' }}>{profilMesaj}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gorunum' && (
            <div className="settings-card">
              <h3>Görünüm</h3>
              <p className="card-subtitle">Uygulamanın görünümünü kişiselleştirin.</p>

              <div className="appearance-row">
                <div className="app-label">Tema</div>
                <div className="toggle-group">
                  <button className={`toggle-btn ${!isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(false)}>
                    <svg viewBox="0 0 24 24" className="theme-svg-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    Açık
                  </button>
                  <button className={`toggle-btn ${isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(true)}>
                    <svg viewBox="0 0 24 24" className="theme-svg-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    Koyu
                  </button>
                </div>
              </div>

              <div className="appearance-row">
                <div className="app-label">Vurgu Rengi</div>
                <div className="color-circles">
                  {renkler.map((renk) => (
                    <button key={renk} className="color-circle" style={{ background: renk }} onClick={() => handleVurguRengiDegis(renk)}>
                      {vurguRengi === renk && <svg viewBox="0 0 24 24" className="check-svg-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="appearance-row">
                <div className="app-label">Yazı Tipi</div>
                <select className="settings-select" value={yaziTipi} onChange={(e) => handleYaziTipiDegis(e.target.value)}>
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Poppins</option>
                </select>
              </div>

              <div className="appearance-row">
                <div className="app-label">Renk Yoğunluğu</div>
                <div className="toggle-group">
                  <button className={`toggle-btn ${renkYogunlugu === 'dusuk' ? 'active' : ''}`} onClick={() => handleRenkYogunluguDegis('dusuk')}>Düşük</button>
                  <button className={`toggle-btn ${renkYogunlugu === 'orta' ? 'active' : ''}`} onClick={() => handleRenkYogunluguDegis('orta')}>Orta</button>
                  <button className={`toggle-btn ${renkYogunlugu === 'yuksek' ? 'active' : ''}`} onClick={() => handleRenkYogunluguDegis('yuksek')}>Yüksek</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bildirimler' && (
            <div className="settings-card">
              <h3>Bildirimler</h3>
              <p className="card-subtitle">Hangi bildirimleri almak istediğinizi seçin.</p>

              {bildirimLoading ? (
                <p>Yükleniyor...</p>
              ) : (
                <div className="notifications-grid">
                  {bildirimListesi.map((item) => (
                    <div className="notification-item" key={item.key}>
                      <div className="notif-info">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={!!bildirimler[item.key]} onChange={() => handleBildirimToggle(item.key)} />
                        <span className="slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'guvenlik' && (
            <div className="settings-card-group">
              <div className="settings-card">
                <h3>Şifre Değiştir</h3>
                <p className="card-subtitle">Şifrenizi değiştirin ve hesabınızı koruyun.</p>

                <div className="input-group mt-15">
                  <label>Mevcut Şifre</label>
                  <input type="password" placeholder="••••••••" value={eskiSifre} onChange={(e) => setEskiSifre(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Yeni Şifre</label>
                  <input type="password" placeholder="••••••••" value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Yeni Şifre (Tekrar)</label>
                  <input type="password" placeholder="••••••••" value={yeniSifreTekrar} onChange={(e) => setYeniSifreTekrar(e.target.value)} />
                </div>
                <button className="btn-primary mt-15" onClick={handleSifreKaydet} disabled={sifreKaydediliyor}>
                  {sifreKaydediliyor ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                </button>
                {sifreMesaj && <p style={{ marginTop: '10px' }}>{sifreMesaj}</p>}
              </div>

              <div className="security-side-cards">
                <div className="settings-card mini-card">
                  <div className="mini-card-header">
                    <h4>İki Faktörlü Kimlik Doğrulama (2FA)</h4>
                    {!totpAktif && !totpSetup && (
                      <button className="btn-outline-small" onClick={handleTotpBaslat}>Aktifleştir</button>
                    )}
                  </div>
                  <p>Hesabınızı daha güvenli hale getirin.</p>
                  <span className="status-badge gray">{totpAktif ? '🟢 Açık' : '🔴 Kapalı'}</span>

                  {totpMesaj && <p style={{ marginTop: '10px' }}>{totpMesaj}</p>}

                  {totpSetup && (
                    <div style={{ marginTop: '15px' }}>
                      <p>Authenticator uygulamanla (Google Authenticator, Authy vb.) bu QR kodu tara:</p>
                      <img src={totpSetup.qr_code} alt="QR Kod" style={{ width: '180px' }} />
                      <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>Ya da manuel gir: {totpSetup.secret}</p>
                      <input
                        type="text"
                        placeholder="6 haneli kod"
                        value={totpKod}
                        onChange={(e) => setTotpKod(e.target.value)}
                        style={{ marginTop: '8px', marginBottom: '8px', display: 'block' }}
                      />
                      <button className="btn-primary" onClick={handleTotpEtkinlestir}>Doğrula ve Aktifleştir</button>
                    </div>
                  )}

                  {backupKodlar.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <p><strong>Yedek Kodların (bir daha gösterilmeyecek, kaydet!):</strong></p>
                      <ul>
                        {backupKodlar.map((kod) => <li key={kod}>{kod}</li>)}
                      </ul>
                    </div>
                  )}

                  {totpAktif && (
                    <div style={{ marginTop: '15px' }}>
                      <p>2FA'yı kapatmak için şifreni ve mevcut kodunu gir:</p>
                      <input
                        type="password"
                        placeholder="Şifre"
                        value={disableSifre}
                        onChange={(e) => setDisableSifre(e.target.value)}
                        style={{ marginBottom: '8px', display: 'block' }}
                      />
                      <input
                        type="text"
                        placeholder="6 haneli kod ya da yedek kod"
                        value={disableKod}
                        onChange={(e) => setDisableKod(e.target.value)}
                        style={{ marginBottom: '8px', display: 'block' }}
                      />
                      <button className="btn-outline-small" onClick={handleTotpDevreDisi}>2FA'yı Kapat</button>
                    </div>
                  )}
                </div>

                <div className="settings-card mini-card">
                  <div className="mini-card-header">
                    <h4>Aktif Oturumlar</h4>
                  </div>
                  <p>Bu özellik yakında eklenecek.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Ayarlar;