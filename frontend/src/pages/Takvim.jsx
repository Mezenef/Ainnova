import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Takvim.css';
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

const gunAdlari = ['Paz', 'Pzt', 'Salı', 'Çar', 'Per', 'Cum', 'Cmt'];
const GOSTERILEN_HAFTA_SAYISI = 4;

const Takvim = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [haftaOffset, setHaftaOffset] = useState(0);

  useEffect(() => {
    const getContents = async () => {
      try {
        const response = await api.get("contents/");
        setContents((response.data.results || response.data).filter((c) => c.scheduled_at));
      } catch (err) {
        console.error("Takvim verisi alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };
    getContents();
  }, []);

  const today = new Date();
  const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
  const ilkPazartesi = new Date(today);
  ilkPazartesi.setDate(today.getDate() - (dayOfWeek - 1) + haftaOffset * GOSTERILEN_HAFTA_SAYISI * 7);

  const haftalar = Array.from({ length: GOSTERILEN_HAFTA_SAYISI }, (_, haftaIndex) => {
    const haftaBaslangic = new Date(ilkPazartesi);
    haftaBaslangic.setDate(ilkPazartesi.getDate() + haftaIndex * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(haftaBaslangic);
      d.setDate(haftaBaslangic.getDate() + i);
      return d;
    });
  });

  const getContentsForDay = (day) => {
    return contents.filter((c) => {
      const cd = new Date(c.scheduled_at);
      return cd.toDateString() === day.toDateString();
    }).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  };

  const upcoming = [...contents]
    .filter((c) => new Date(c.scheduled_at) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 5);

  const araligBaslik = `${haftalar[0][0].toLocaleDateString('tr-TR')} - ${haftalar[GOSTERILEN_HAFTA_SAYISI - 1][6].toLocaleDateString('tr-TR')}`;

  return (
    <div className="calendar-page-container">

      <div className="calendar-header-main">
        <div>
          <h1>Takvim</h1>
          <p>İçerik planını organize et, zamanında paylaş.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate('/uret')}>+ Yeni İçerik Planla</button>
        </div>
      </div>

      <div className="calendar-layout">

        <div className="calendar-main-area">

          <div className="calendar-controls">
            <button className="nav-arrow" onClick={() => setHaftaOffset((prev) => prev - 1)}>←</button>
            <span className="current-date">📅 {araligBaslik}</span>
            <button className="nav-arrow" onClick={() => setHaftaOffset((prev) => prev + 1)}>→</button>
            {haftaOffset !== 0 && (
              <button className="btn-today" onClick={() => setHaftaOffset(0)}>Bugün</button>
            )}
          </div>

          {loading ? (
            <p>Yükleniyor...</p>
          ) : (
            <div className="calendar-grid-wrapper">
              {haftalar.map((haftaGunleri, haftaIndex) => (
                <div key={haftaIndex} className="week-columns" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {haftaGunleri.map((day, i) => (
                    <div key={i} className="day-column" style={{ flex: 1, minWidth: 0, minHeight: '110px' }}>
                      <div className={`day-header ${day.toDateString() === today.toDateString() ? 'active' : ''}`}>
                        {gunAdlari[day.getDay()]} <br />
                        <span className={day.toDateString() === today.toDateString() ? 'active-date' : ''}>
                          {day.getDate()} {day.toLocaleDateString('tr-TR', { month: 'short' })}
                        </span>
                      </div>
                      <div className="day-events">
                        {getContentsForDay(day).map((c) => (
                          <div
                            key={c.id}
                            className={`event-card ${c.platform?.toLowerCase()}`}
                            onClick={() => navigate(`/sonuclar/${c.id}`)}
                            style={{ cursor: 'pointer', marginBottom: '6px' }}
                          >
                            {platformIcon[c.platform] || '📄'} {c.topic || c.platform_display}
                            <br />
                            <span>{new Date(c.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="upcoming-contents">
            <h3>Yaklaşan İçerikler</h3>
            <div className="upcoming-cards">
              {upcoming.length === 0 && <p className="text-muted">Planlanmış içerik yok.</p>}
              {upcoming.map((c) => (
                <div className="up-card" key={c.id} onClick={() => navigate(`/sonuclar/${c.id}`)} style={{ cursor: 'pointer' }}>
                  <span className={`up-icon ${c.platform?.toLowerCase()}`}>{platformIcon[c.platform] || '📄'}</span>
                  <div className="up-info">
                    <strong>{c.topic || c.platform_display}</strong>
                    <span>{new Date(c.scheduled_at).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <aside className="calendar-sidebar">
          <div className="sidebar-widget">
            <div className="widget-header">
              <h3>Yapılacaklar</h3>
            </div>
            <p className="text-muted">Bu bölüm henüz backend'e bağlanmadı.</p>
          </div>

          <div className="sidebar-widget">
            <div className="widget-header">
              <h3>Bağlantılı Takvimler</h3>
            </div>
            <p className="text-muted">Google/Outlook entegrasyonu henüz yapılmadı.</p>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Takvim;