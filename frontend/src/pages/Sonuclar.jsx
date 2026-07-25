import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Sonuclar.css';
import api from "../api/axios";

const Sonuclar = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLang, setActiveLang] = useState('TR');

  useEffect(() => {
    const getContent = async () => {
      try {
        const response = await api.get(`contents/${id}/`);
        setContent(response.data);
      } catch (err) {
        console.error("İçerik alınamadı:", err);
        setError("İçerik bulunamadı.");
      } finally {
        setLoading(false);
      }
    };
    getContent();
  }, [id]);

  if (loading) return <div className="results-container"><p>Yükleniyor...</p></div>;
  if (error) return <div className="results-container"><p className="error-text">{error}</p></div>;

  return (
    <div className="results-container">
      <div className="results-top-bar">
        <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); navigate('/gecmis'); }}>← Ana panele dön</a>
        <div className="top-actions">
          <button className="btn-outline-action">🔄 Yeniden üret</button>
          <button className="btn-primary-action">📅 Takvime ekle</button>
        </div>
      </div>

      <div className="results-header-info">
        <h1>Üretim Sonucu</h1>
        <p className="meta-text">
          {content.topic || content.platform_display} • {new Date(content.created_at).toLocaleString('tr-TR')}
        </p>

        <div className="lang-tabs">
          <button className={`lang-tab ${activeLang === 'TR' ? 'active' : ''}`} onClick={() => setActiveLang('TR')}>TR</button>
          <button className={`lang-tab ${activeLang === 'EN' ? 'active' : ''}`} onClick={() => setActiveLang('EN')}>EN</button>
        </div>
        <p className="info-text">{content.status_display}</p>
      </div>

      <div className="content-blocks-grid">
        <div className="content-card pink-theme">
          <div className="card-top">
            <span className="badge">📢 {content.platform_display} Bloğu</span>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(content.generated_text || '')}>📄 Kopyala</button>
          </div>

          <div className="card-body">
            <h4 className="section-title">{content.content_type_display}</h4>
            {content.generated_text ? (
              <p>{content.generated_text}</p>
            ) : (
              <p className="text-muted">Bu içerik henüz üretilmedi (durum: {content.status_display}). Ajan işlemi tamamlayınca burada görünecek.</p>
            )}
            {content.extra_info && (
              <>
                <div className="divider-light"></div>
                <h4 className="section-title">Ek Bilgi</h4>
                <p>{content.extra_info}</p>
              </>
            )}
          </div>
        </div>

        {content.media_url && (
          <div className="content-card green-theme">
            <div className="card-top">
              <span className="badge">🖼️ Medya</span>
            </div>
            <div className="card-body">
              <img src={content.media_url} alt="Üretilen medya" style={{ maxWidth: '100%' }} />
            </div>
          </div>
        )}
      </div>

      <div className="results-bottom-bar">
        <div className="feedback-section">
          <span>Bu içeriği beğendiniz mi?</span>
          <button className="feedback-btn">👍 Beğendim</button>
          <button className="feedback-btn">👎 Beğenmedim</button>
        </div>

        <button className="btn-copy-all" onClick={() => navigator.clipboard.writeText(content.generated_text || '')}>
          📄 Kopyala (Hepsi)
        </button>
      </div>
    </div>
  );
};

export default Sonuclar;