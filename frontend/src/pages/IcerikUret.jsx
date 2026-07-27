import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  // Aleyna'nın backend için ihtiyaç duyduğu state'ler
  const [konu, setKonu] = useState(''); 
  const [icerikTuru, setIcerikTuru] = useState('linkedin');
  const [ton, setTon] = useState('profesyonel');
  const [uzunluk, setUzunluk] = useState('kisa');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  
  // UI State'leri
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uretilenIcerik, setUretilenIcerik] = useState(null);
  const [hashtagListesi, setHashtagListesi] = useState([]);
  const [duzenlemeModu, setDuzenlemeModu] = useState(false);
  const [duzenlenmisMetin, setDuzenlenmisMetin] = useState('');
  const [kopyalandi, setKopyalandi] = useState(false);
  
  const menuRef = useRef(null);

  // Kampanyaları Getir (Arka planda otomatik ilkini seçer, menüde gösterilmez)
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

  // Menü dışına tıklanınca kapatma
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Aleyna'nın API Gönderim Mantığı
  const handleGenerate = async () => {
    if (!konu.trim()) {
      setError("Lütfen ne hakkında yazmak istediğinizi belirtin.");
      return;
    }
    if (!selectedCampaign) {
      setError("Arka planda kullanılabilecek aktif bir kampanya bulunamadı.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setDuzenlemeModu(false);
    setIsMenuOpen(false); // Menüyü kapat
    
    try {
      const response = await api.post("contents/", {
        campaign: selectedCampaign,
        platform: platformMap[icerikTuru],
        content_type: contentTypeMap[icerikTuru],
        topic: konu,
        extra_info: "", 
        tone: ton,
        length: uzunluk,
        scheduled_at: null, 
      });

      const agentResponse = await api.post(`contents/${response.data.id}/trigger-agent/`);
      setUretilenIcerik(agentResponse.data.content);
      setHashtagListesi(agentResponse.data.hashtags || []);
    } catch (err) {
      console.error("İçerik oluşturma hatası:", err.response?.data || err);
      setError("İçerik oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const gosterilecekMetin = () => {
    if (icerikTuru === 'hashtag' && hashtagListesi.length > 0) {
      return hashtagListesi.map((h) => `#${h}`).join(' ');
    }
    return duzenlemeModu ? duzenlenmisMetin : (uretilenIcerik?.generated_text || '');
  };

  const handleKopyala = () => {
    navigator.clipboard.writeText(gosterilecekMetin());
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  const handleDuzenleToggle = () => {
    if (!duzenlemeModu) {
      setDuzenlenmisMetin(uretilenIcerik?.generated_text || '');
    }
    setDuzenlemeModu(!duzenlemeModu);
  };

  const handleDuzenlemeKaydet = async () => {
    try {
      await api.patch(`contents/${uretilenIcerik.id}/`, { generated_text: duzenlenmisMetin });
      setUretilenIcerik({ ...uretilenIcerik, generated_text: duzenlenmisMetin });
      setDuzenlemeModu(false);
    } catch (err) {
      console.error("Düzenleme kaydedilemedi:", err);
    }
  };

  const handleIndir = async () => {
    const metin = gosterilecekMetin();
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:600px;padding:30px;background:white;font-family:Arial,sans-serif;white-space:pre-wrap;color:#111;';
    el.innerHTML = `<h2 style="margin-bottom:16px;">${(konu || 'Ainnova İçerik').replace(/</g, '&lt;')}</h2><div style="line-height:1.6;font-size:14px;">${metin.replace(/</g, '&lt;')}</div>`;
    document.body.appendChild(el);

    const canvas = await html2canvas(el, { scale: 2 });
    document.body.removeChild(el);

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    doc.save(`${(konu || 'icerik').slice(0, 30)}.pdf`);
  };

  return (
    <div className="icerik-uret-container">
      
      {/* Ana Ekran / Sonuç Ekranı */}
      <div className="icerik-main">
        {!uretilenIcerik && !loading ? (
          <div className="welcome-screen">
            <h2>Hoşgeldin, üretmeye başla! ✨</h2>
            <p>Ne hakkında yazmak istersin? Aşağıya birkaç kelime bırak.</p>
            {error && <p className="error-text-center">{error}</p>}
          </div>
        ) : (
          <div className="result-screen">
             {loading ? (
               <div className="loader-container">
                 <div className="loader"></div>
                 <p>Yapay zeka içeriğinizi oluşturuyor...</p>
               </div>
             ) : (
               <>
                 <div className="preview-header">
                    <h3>✨ Oluşturulan İçerik</h3>
                    <span className="platform-badge linkedin">
                      {badgeLabel[icerikTuru].icon} {badgeLabel[icerikTuru].text}
                    </span>
                 </div>
                 
                 <div className="preview-content">
                    {icerikTuru === 'gorsel' && (
                      <div className="info-alert">
                        ⚠️ Görsel oluşturma henüz desteklenmiyor. Metin çıktısı gösteriliyor.
                      </div>
                    )}
                    
                    {duzenlemeModu ? (
                      <>
                        <textarea
                          className="edit-textarea"
                          value={duzenlenmisMetin}
                          onChange={(e) => setDuzenlenmisMetin(e.target.value)}
                          rows="8"
                        />
                        <button className="btn-primary mt-10" onClick={handleDuzenlemeKaydet}>Kaydet</button>
                      </>
                    ) : (
                      <div className="result-text">{gosterilecekMetin()}</div>
                    )}
                 </div>

                 {!duzenlemeModu && (
                    <div className="preview-actions">
                      <button className="btn-action" onClick={handleKopyala}>
                        {kopyalandi ? "✓ Kopyalandı" : "📄 Kopyala"}
                      </button>
                      <button className="btn-action" onClick={handleDuzenleToggle}>✏️ Düzenle</button>
                      <button className="btn-action" onClick={handleGenerate}>🔄 Tekrar</button>
                      <button className="btn-action" onClick={handleIndir}>📥 İndir</button>
                    </div>
                 )}
               </>
             )}
          </div>
        )}
      </div>

      {/* Alt Giriş Çubuğu (Input Area) */}
      <div className="input-area-wrapper">
         <div className="input-box">
            
            {/* Sol Taraf: + Butonu ve Açılır Menüler */}
            <div className="menu-container" ref={menuRef}>
               <button className="plus-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <svg viewBox="0 0 24 24" className="plus-icon">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
               </button>

               {isMenuOpen && (
                  <div className="options-popup">

                     <div className="option-item">
                        <span>İçerik Türü</span>
                        <svg viewBox="0 0 24 24" className="chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        <div className="submenu">
                           <div className={`submenu-item ${icerikTuru === 'linkedin' ? 'active' : ''}`} onClick={() => setIcerikTuru('linkedin')}>LinkedIn {icerikTuru === 'linkedin' && <span className="check-mark">✓</span>}</div>
                           <div className={`submenu-item ${icerikTuru === 'gorsel' ? 'active' : ''}`} onClick={() => setIcerikTuru('gorsel')}>Görsel {icerikTuru === 'gorsel' && <span className="check-mark">✓</span>}</div>
                           <div className={`submenu-item ${icerikTuru === 'metin' ? 'active' : ''}`} onClick={() => setIcerikTuru('metin')}>Metin {icerikTuru === 'metin' && <span className="check-mark">✓</span>}</div>
                           <div className={`submenu-item ${icerikTuru === 'hashtag' ? 'active' : ''}`} onClick={() => setIcerikTuru('hashtag')}>Hashtag {icerikTuru === 'hashtag' && <span className="check-mark">✓</span>}</div>
                        </div>
                     </div>
                     
                     <div className="option-item">
                        <span>Ton</span>
                        <svg viewBox="0 0 24 24" className="chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        <div className="submenu">
                           {['profesyonel', 'samimi', 'kurumsal', 'eglenceli'].map(t => (
                              <div key={t} className={`submenu-item ${ton === t ? 'active' : ''}`} onClick={() => setTon(t)}>
                                 {t.charAt(0).toUpperCase() + t.slice(1)} {ton === t && <span className="check-mark">✓</span>}
                              </div>
                           ))}
                        </div>
                     </div>
                     
                     <div className="option-item">
                        <span>Uzunluk</span>
                        <svg viewBox="0 0 24 24" className="chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        <div className="submenu">
                           {[
                             { id: 'kisa', label: 'Kısa' },
                             { id: 'orta', label: 'Orta' },
                             { id: 'uzun', label: 'Uzun' }
                           ].map(u => (
                              <div key={u.id} className={`submenu-item ${uzunluk === u.id ? 'active' : ''}`} onClick={() => setUzunluk(u.id)}>
                                 {u.label} {uzunluk === u.id && <span className="check-mark">✓</span>}
                              </div>
                           ))}
                        </div>
                     </div>

                  </div>
               )}
            </div>

            {/* Orta Taraf: Metin Girdisi */}
            <input 
               type="text" 
               className="main-input" 
               placeholder="İçerik konunuzu buraya yazın..." 
               value={konu}
               onChange={(e) => setKonu(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            />

            {/* Sağ Taraf: Gönderme Butonu */}
            <button className="send-btn" onClick={handleGenerate} disabled={!konu.trim() || loading}>
               <svg viewBox="0 0 24 24" className="send-icon">
                 <line x1="22" y1="2" x2="11" y2="13"></line>
                 <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
               </svg>
            </button>

         </div>
      </div>
    </div>
  );
};

export default IcerikUret;