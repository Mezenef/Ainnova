import React, { useState, useEffect } from 'react';
import './IcerikUret.css';
import api from "../api/axios";

const platformMap = {
  linkedin: "LINKEDIN",
  gorsel: "INSTAGRAM",
  metin: "BLOG",
  hashtag: "LINKEDIN",
};

const contentTypeMap = {
  linkedin: "TEXT",
  gorsel: "IMAGE",
  metin: "TEXT",
  hashtag: "TEXT",
};

const badgeLabel = {
  linkedin: { icon: 'in', text: 'LinkedIn Gönderisi' },
  gorsel: { icon: '🖼️', text: 'Görsel Oluşturucu' },
  metin: { icon: '✍️', text: 'Metin Düzenleyici' },
  hashtag: { icon: '#', text: 'Hashtag Üretici' },
};

const IcerikUret = () => {
  const [icerikTuru, setIcerikTuru] = useState('linkedin');
  const [ton, setTon] = useState('profesyonel');
  const [uzunluk, setUzunluk] = useState('orta');
  const [konu, setKonu] = useState('');
  const [ekBilgi, setEkBilgi] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uretilenIcerik, setUretilenIcerik] = useState(null);

  useEffect(() => {
    const getCampaigns = async () => {
      try {
        const response = await api.get("campaigns/");
        setCampaigns(response.data);
        if (response.data.length > 0) {
          setSelectedCampaign(response.data[0].id);
        }
      } catch (err) {
        console.error("Kampanyalar alınamadı:", err);
      }
    };
    getCampaigns();
  }, []);

  const secilenKampanya = campaigns.find((c) => String(c.id) === String(selectedCampaign));
  const markaAdi = secilenKampanya?.brand_detail?.name || "Marka seçilmedi";

  const handleGenerate = async () => {
    if (!konu.trim()) {
      setError("Konu alanı zorunlu.");
      return;
    }
    if (!selectedCampaign) {
      setError("Lütfen bir kampanya seçin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("contents/", {
        campaign: selectedCampaign,
        platform: platformMap[icerikTuru],
        content_type: contentTypeMap[icerikTuru],
        topic: konu,
        extra_info: ekBilgi,
        tone: ton,
        length: uzunluk,
        scheduled_at: scheduledAt || null,
      });
      setUretilenIcerik(response.data);
    } catch (err) {
      console.error("İçerik oluşturma hatası:", err.response?.data || err);
      setError("İçerik oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>İçeriği Oluştur</h1>
        <p>İhtiyacınıza uygun içerik türünü seçin, detayları girin ve saniyeler içinde içeriğinizi oluşturun.</p>
        <div className="brand-selector">
          <span className="brand-dot">🟢</span> Marka Rehberi
          <strong>{markaAdi}</strong>
        </div>
      </div>

      <div className="content-creator-grid">
        <div className="creator-form-section">

          <div className="form-group">
            <label>Kampanya <span className="required">*</span></label>
            <select
              className="filter-select"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
            >
              {campaigns.length === 0 && <option value="">Kampanya bulunamadı</option>}
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>1. İçerik Türü <span className="required">*</span></label>
            <div className="type-cards">
              <div className={`type-card ${icerikTuru === 'linkedin' ? 'active' : ''}`} onClick={() => setIcerikTuru('linkedin')}>
                <div className="icon blue">in</div>
                <span>LinkedIn Gönderisi</span>
                {icerikTuru === 'linkedin' && <div className="check-mark">✓</div>}
              </div>
              <div className={`type-card ${icerikTuru === 'gorsel' ? 'active' : ''}`} onClick={() => setIcerikTuru('gorsel')}>
                <div className="icon purple">🖼️</div>
                <span>Görsel Oluşturucu</span>
                {icerikTuru === 'gorsel' && <div className="check-mark">✓</div>}
              </div>
              <div className={`type-card ${icerikTuru === 'metin' ? 'active' : ''}`} onClick={() => setIcerikTuru('metin')}>
                <div className="icon pink">✍️</div>
                <span>Metin Düzenleyici</span>
                {icerikTuru === 'metin' && <div className="check-mark">✓</div>}
              </div>
              <div className={`type-card ${icerikTuru === 'hashtag' ? 'active' : ''}`} onClick={() => setIcerikTuru('hashtag')}>
                <div className="icon gray">#</div>
                <span>Hashtag Üretici</span>
                {icerikTuru === 'hashtag' && <div className="check-mark">✓</div>}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>2. Konu <span className="required">*</span></label>
            <textarea
              placeholder="İçeriğinizin ana konusunu yazın..."
              rows="3"
              maxLength={150}
              value={konu}
              onChange={(e) => setKonu(e.target.value)}
            />
            <div className="char-count">{konu.length}/150</div>
          </div>

          <div className="form-group">
            <label>3. Ek Bilgi <span className="text-muted">(Opsiyonel)</span></label>
            <textarea
              placeholder="Eklemek istediğiniz detayları yazın..."
              rows="4"
              maxLength={300}
              value={ekBilgi}
              onChange={(e) => setEkBilgi(e.target.value)}
            />
            <div className="char-count">{ekBilgi.length}/300</div>
          </div>

          <div className="form-group">
            <label>4. Ton</label>
            <div className="button-group">
              <button className={`btn-outline ${ton === 'profesyonel' ? 'active' : ''}`} onClick={() => setTon('profesyonel')}>💼 Profesyonel</button>
              <button className={`btn-outline ${ton === 'samimi' ? 'active' : ''}`} onClick={() => setTon('samimi')}>😊 Samimi</button>
              <button className={`btn-outline ${ton === 'kurumsal' ? 'active' : ''}`} onClick={() => setTon('kurumsal')}>🏢 Kurumsal</button>
              <button className={`btn-outline ${ton === 'eglenceli' ? 'active' : ''}`} onClick={() => setTon('eglenceli')}>🎉 Eğlenceli</button>
            </div>
          </div>

          <div className="form-group">
            <label>5. Uzunluk</label>
            <div className="button-group">
              <button className={`btn-outline ${uzunluk === 'kisa' ? 'active' : ''}`} onClick={() => setUzunluk('kisa')}>≡ Kısa</button>
              <button className={`btn-outline ${uzunluk === 'orta' ? 'active' : ''}`} onClick={() => setUzunluk('orta')}>≡ Orta</button>
              <button className={`btn-outline ${uzunluk === 'uzun' ? 'active' : ''}`} onClick={() => setUzunluk('uzun')}>≡ Uzun</button>
            </div>
          </div>

          <div className="form-group">
            <label>6. Planlanan Tarih/Saat <span className="text-muted">(Opsiyonel)</span></label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <button className="btn-primary w-100 generate-btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Oluşturuluyor..." : "✨ İçeriği Oluştur"}
          </button>
          {error && <p className="error-text">{error}</p>}
          <p className="hint-text">Oluşturulan içerikler marka rehberinize uygun şekilde hazırlanır.</p>
        </div>

        <div className="creator-preview-section">
          <div className="preview-header">
            <h3>✨ Oluşturulan İçerik</h3>
            <span className="platform-badge linkedin">
              {badgeLabel[icerikTuru].icon} {badgeLabel[icerikTuru].text}
            </span>
          </div>

          <div className="preview-content">
            {uretilenIcerik ? (
              <p>{uretilenIcerik.generated_text || "İşleniyor, birazdan hazır olacak..."}</p>
            ) : (
              <p className="text-muted">Henüz içerik oluşturulmadı.</p>
            )}
          </div>

          {uretilenIcerik && (
            <div className="preview-actions">
              <button className="btn-action">📄 Kopyala</button>
              <button className="btn-action">✏️ Düzenle</button>
              <button className="btn-action" onClick={handleGenerate}>🔄 Tekrar Oluştur</button>
              <button className="btn-action">📥 İndir</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IcerikUret;