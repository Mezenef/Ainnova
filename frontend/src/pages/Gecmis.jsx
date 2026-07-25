import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Gecmis.css';
import api from "../api/axios";

const Gecmis = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [aramaMetni, setAramaMetni] = useState('');
  const [turFiltre, setTurFiltre] = useState('hepsi');
  const [siralama, setSiralama] = useState('yeni');

  useEffect(() => {
    const getContents = async () => {
      try {
        const response = await api.get("contents/");
        setTableData(response.data);
      } catch (err) {
        console.error("Geçmiş verisi alınamadı:", err);
        setError("İçerikler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    getContents();
  }, []);

  const handleSil = async (id) => {
    if (!window.confirm("Bu içeriği silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`contents/${id}/`);
      setTableData((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Silme başarısız:", err);
      alert("İçerik silinemedi.");
    }
  };

  const statusColorMap = {
    PENDING: 'gray',
    GENERATING: 'blue',
    READY: 'blue',
    FAILED: 'red',
    PUBLISHED: 'green',
  };

  // Filtre için mevcut türleri veriden çıkar
  const turSecenekleri = [...new Set(tableData.map((r) => r.content_type_display).filter(Boolean))];

  const filtrelenmisVeri = tableData
    .filter((row) => {
      if (turFiltre !== 'hepsi' && row.content_type_display !== turFiltre) return false;
      if (aramaMetni.trim()) {
        const arama = aramaMetni.toLowerCase();
        const hedefMetin = `${row.topic || ''} ${row.generated_text || ''} ${row.platform_display || ''}`.toLowerCase();
        if (!hedefMetin.includes(arama)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const tarihA = new Date(a.created_at);
      const tarihB = new Date(b.created_at);
      return siralama === 'yeni' ? tarihB - tarihA : tarihA - tarihB;
    });

  return (
    <div className="history-container">
      <div className="history-header">
        <div>
          <h1>Geçmiş</h1>
          <p>Oluşturduğun içerikleri görüntüle, düzenle veya tekrar kullan.</p>
        </div>
        <div className="history-filters">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Geçmişte ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
            />
          </div>
          <select className="filter-select" value={turFiltre} onChange={(e) => setTurFiltre(e.target.value)}>
            <option value="hepsi">Tüm Türler</option>
            {turSecenekleri.map((tur) => (
              <option key={tur} value={tur}>{tur}</option>
            ))}
          </select>
          <select className="filter-select" value={siralama} onChange={(e) => setSiralama(e.target.value)}>
            <option value="yeni">En Yeni</option>
            <option value="eski">En Eski</option>
          </select>
        </div>
      </div>

      <div className="history-card">
        <h3 className="card-title">Son Oluşturulanlar</h3>

        <div className="table-responsive">
          {loading ? (
            <p>Yükleniyor...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : filtrelenmisVeri.length === 0 ? (
            <p>Sonuç bulunamadı.</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>İçerik</th>
                  <th>Tür</th>
                  <th>Oluşturulma</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmisVeri.map((row) => (
                  <tr key={row.id}>
                    <td className="content-col">
                      <div className="icon-box gray">📄</div>
                      <div className="content-info">
                        <span className="content-title">
                          {row.topic || row.generated_text?.slice(0, 40) || 'İşleniyor...'}
                        </span>
                        <span className="content-desc">{row.platform_display}</span>
                      </div>
                    </td>
                    <td>
                      <span className="type-badge gray">{row.content_type_display}</span>
                    </td>
                    <td className="date-col">{new Date(row.created_at).toLocaleString('tr-TR')}</td>
                    <td>
                      <span className={`status-badge ${statusColorMap[row.status] || 'gray'}`}>
                        {row.status_display}
                      </span>
                    </td>
                    <td className="actions-col">
                      <button className="action-btn" onClick={() => navigate(`/sonuclar/${row.id}`)}>👁️</button>
                      <button className="action-btn" onClick={() => handleSil(row.id)}>⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <button className="page-btn text-btn">← Önceki</button>
          <button className="page-btn active">1</button>
          <button className="page-btn text-btn">Sonraki →</button>
        </div>
      </div>
    </div>
  );
};

export default Gecmis;