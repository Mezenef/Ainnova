import React, { useState } from 'react';
import './Yardim.css';

const sss = [
  {
    soru: "Nasıl yeni bir içerik oluşturabilirim?",
    cevap: "Sol menüden 'İçerik Üret' sayfasına git, bir kampanya ve içerik türü seç, konuyu yaz ve 'İçeriği Oluştur'a bas.",
  },
  {
    soru: "İçeriğim neden hemen görünmüyor?",
    cevap: "İçerikler bir yapay zeka ajanı tarafından arka planda üretilir. Durumu 'Ajan Bekleniyor' veya 'Üretiliyor' ise birkaç dakika içinde tamamlanır, Geçmiş sayfasından takip edebilirsin.",
  },
  {
    soru: "Takvimde içeriklerimi nasıl planlarım?",
    cevap: "İçerik Üret formunda 'Planlanan Tarih/Saat' alanına bir tarih girersen, o içerik otomatik olarak Takvim sayfasında o günde görünür.",
  },
  {
    soru: "Şifremi unuttum, ne yapmalıyım?",
    cevap: "Giriş sayfasındaki 'Şifreni mi unuttun?' linkine tıklayıp kayıtlı e-postanı girmen yeterli, sıfırlama bağlantısı gönderilir.",
  },
  {
    soru: "Bildirim tercihlerimi nereden değiştiririm?",
    cevap: "Ayarlar sayfasındaki 'Bildirimler' sekmesinden hangi bildirimleri almak istediğini seçebilirsin.",
  },
  {
    soru: "Bir içeriği nasıl silerim?",
    cevap: "Geçmiş sayfasında ilgili satırdaki '⋮' butonuna tıklayıp onaylaman yeterli.",
  },
];

const Yardim = () => {
  const [acikIndex, setAcikIndex] = useState(null);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Yardım</h1>
        <p>Sık sorulan sorular ve kullanım rehberi.</p>
      </div>

      <div className="settings-card" style={{ maxWidth: '800px' }}>
        {sss.map((item, index) => (
          <div key={index} style={{ borderBottom: '1px solid #eee', padding: '16px 0' }}>
            <div
              onClick={() => setAcikIndex(acikIndex === index ? null : index)}
              style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontWeight: 600 }}
            >
              <span>{item.soru}</span>
              <span>{acikIndex === index ? '−' : '+'}</span>
            </div>
            {acikIndex === index && (
              <p className="text-muted" style={{ marginTop: '10px' }}>{item.cevap}</p>
            )}
          </div>
        ))}

        <div style={{ marginTop: '20px' }}>
          <p className="text-muted">
            Sorunun burada yoksa, bize <a href="mailto:destek@ainnova.com">destek@ainnova.com</a> adresinden ulaşabilirsin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Yardim;