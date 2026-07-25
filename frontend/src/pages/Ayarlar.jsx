import React, { useState, useEffect } from 'react';
import './Ayarlar.css';
import { useTheme } from '../context/ThemeContext';
import api from "../api/axios";

const Ayarlar = () => {
  const [activeTab, setActiveTab] = useState('profil');

  const {
    isDarkMode, setIsDarkMode,
    accentColor: vurguRengi, setAccentColor: handleVurguRengiDegis,
    fontFamily: yaziTipi, setFontFamily: handleYaziTipiDegis,
    colorSaturation: renkYogunlugu, setColorSaturation: handleRenkYogunluguDegis,
  } = useTheme();

  // Profil state'leri
  const [profil, setProfil] = useState({ username: '', email: '', first_name: '', last_name: '' });
  const [profilLoading, setProfilLoading] = useState(true);
  const [profilKaydediliyor, setProfilKaydediliyor] = useState(false);
  const [profilMesaj, setProfilMesaj] = useState(null);

  // Bildirim state'leri
  const [bildirimler, setBildirimler] = useState({
    email_notifications: true,
    weekly_report: true,
    push_notifications: false,
    ai_tips: true,
    content_ready: true,
  });
  const [bildirimLoading, setBildirimLoading] = useState(true);

  // Şifre değiştirme state'leri
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
      const response = await api.post("me/change-password/", {
        eski_sifre: eskiSifre,
        yeni_sifre: yeniSifre,
      });
      setSifreMesaj(response.data.message || "Şifre güncellendi.");
      setEskiSifre('');
      setYeniSifre('');
      setYeniSifreTekrar('');
    } catch (err) {
      setSifreMesaj(err.response?.data?.error || "Şifre güncellenemedi.");
    } finally {
      setSifreKaydediliyor(false);
    }
  };

  const renkler = ['#4a47a3', '#0a66c2', '#2ea05b', '#f26d21', '#d66685', '#1a1a1a'];

  const bildirimListesi = [
    { key: 'email_notifications', icon: '✉️', label: 'E-posta bildirimleri' },
    { key: 'weekly_report', icon: '📊', label: 'Haftalık performans raporu' },
    { key: 'push_notifications', icon: '🔔', label: 'Tarayıcı (Push) bildirimleri' },
    { key: 'ai_tips', icon: '💡', label: 'AI önerileri ve ipuçları' },
    { key: 'content_ready', icon: '✨', label: 'İçerik hazır olduğunda' },
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
            <span className="tab-icon">👤</span> Profil
          </button>
          <button className={`settings-tab ${activeTab === 'gorunum' ? 'active' : ''}`} onClick={() => setActiveTab('gorunum')}>
            <span className="tab-icon">🎨</span> Görünüm
          </button>
          <button className={`settings-tab ${activeTab === 'bildirimler' ? 'active' : ''}`} onClick={() => setActiveTab('bildirimler')}>
            <span className="tab-icon">🔔</span> Bildirimler
          </button>
          <button className={`settings-tab ${activeTab === 'guvenlik' ? 'active' : ''}`} onClick={() => setActiveTab('guvenlik')}>
            <span className="tab-icon">🛡️</span> Güvenlik
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
                  <button className={`toggle-btn ${!isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(false)}>☀️ Açık</button>
                  <button className={`toggle-btn ${isDarkMode ? 'active' : ''}`} onClick={() => setIsDarkMode(true)}>🌙 Koyu</button>
                </div>
              </div>

              <div className="appearance-row">
                <div className="app-label">Vurgu Rengi</div>
                <div className="color-circles">
                  {renkler.map((renk) => (
                    <button key={renk} className="color-circle" style={{ background: renk }} onClick={() => handleVurguRengiDegis(renk)}>
                      {vurguRengi === renk && <span className="check">✓</span>}
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
                        <span className="notif-icon">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={!!bildirimler[item.key]}
                          onChange={() => handleBildirimToggle(item.key)}
                        />
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
                    <button className="btn-outline-small" disabled>Yakında</button>
                  </div>
                  <p>Hesabınızı daha güvenli hale getirin.</p>
                  <span className="status-badge gray">🔴 Kapalı</span>
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