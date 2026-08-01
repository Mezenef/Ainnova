import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import api from "../api/axios";

const platformIcon = {
  LINKEDIN: 'in',
  X: '𝕏',
  INSTAGRAM: '📸',
  FACEBOOK: 'f',
  GOOGLE_ADS: '🔎',
  META_ADS: '📢',
  BLOG: '📄',
  EMAIL: '✉️',
};

const goreliZaman = (tarihStr) => {
  const tarih = new Date(tarihStr);
  const simdi = new Date();
  const farkGun = Math.floor((simdi.setHours(0,0,0,0) - new Date(tarih).setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
  const saat = tarih.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (farkGun === 0) return `Bugün, ${saat}`;
  if (farkGun === 1) return `Dün, ${saat}`;
  return `${farkGun} gün önce`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [contents, setContents] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        const [meRes, contentsRes, brandsRes] = await Promise.all([
          api.get("me/"),
          api.get("contents/"),
          api.get("brands/"),
        ]);
        const adSoyad = `${meRes.data.first_name || ''} ${meRes.data.last_name || ''}`.trim();
        setUsername(adSoyad || meRes.data.username);
        setContents(contentsRes.data.results || contentsRes.data);
setBrands(brandsRes.data.results || brandsRes.data);
      } catch (err) {
        console.error("Dashboard verisi alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const buHaftaSayisi = contents.filter((c) => {
    const yediGunOnce = new Date();
    yediGunOnce.setDate(yediGunOnce.getDate() - 7);
    return new Date(c.created_at) >= yediGunOnce;
  }).length;

  const toplamIcerik = contents.length;

  const dikeyler = [...new Set(brands.map((b) => b.vertical).filter(Boolean))];

  const sonAktiviteler = [...contents]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="dashboard-container">

      <div className="welcome-banner">
        <div className="banner-text">
          <span>Merhaba{username ? `, ${username}` : ''} 👋</span>
          <h1>Bugün üretken bir gün olsun!</h1>
        </div>
        <button onClick={() => navigate('/uret')} className="btn-primary new-content-btn">
          + Yeni İçerik Oluştur
        </button>
      </div>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">📄</div>
              <div className="stat-info">
                <h2>{buHaftaSayisi}</h2>
                <p>Bu hafta üretilen içerik</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">📊</div>
              <div className="stat-info">
                <h2>{toplamIcerik}</h2>
                <p>Toplam içerik</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">📚</div>
              <div className="stat-info">
                <h2>{dikeyler.length}</h2>
                <p>Aktif dikeyler</p>
                {dikeyler.length > 0 && (
                  <div className="tags">
                    {dikeyler.map((d) => (
                      <span className="tag" key={d}>{d}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="settings-card" style={{ marginTop: '20px' }}>
            <h3 className="card-title">Son Aktiviteler</h3>
            {sonAktiviteler.length === 0 ? (
              <p className="text-muted">Henüz bir aktivite yok.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sonAktiviteler.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => navigate(`/sonuclar/${c.id}`)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                    }}
                  >
                    <span>
                      {platformIcon[c.platform] || '📄'}{' '}
                      {c.topic || c.platform_display} — {c.status_display}
                    </span>
                    <span className="text-muted" style={{ fontSize: '13px' }}>
                      {goreliZaman(c.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;