import React, { useEffect, useState, useRef } from 'react';
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

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const getContents = async () => {
      try {
        const response = await api.get("contents/");
        setTableData(response.data.results || response.data);
      } catch (err) {
        console.error("Geçmiş verisi alınamadı:", err);
        setError("İçerikler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };
    getContents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSil = async (id) => {
    if (!window.confirm("Bu içeriği silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`contents/${id}/`);
      setTableData((prev) => prev.filter((item) => item.id !== id));
      setActiveMenuId(null);
    } catch (err) {
      console.error("Silme başarısız:", err);
      alert("İçerik silinemedi.");
    }
  };

  const handleGoruntule = (id) => {
    navigate(`/sonuclar/${id}`);
  };

  const handleDuzenle = (row) => {
    navigate('/uret', {
      state: {
        editMode: true,
        contentData: row
      }
    });
  };

  const statusColorMap = {
    PENDING: 'gray',
    GENERATING: 'blue',
    READY: 'blue',
    FAILED: 'red',
    PUBLISHED: 'green',
  };

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
            <svg viewBox="0 0 24 24" className="search-icon-svg"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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

        <div className="table-responsive" ref={menuRef}>
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
                      <div className="icon-box gray">
                        <svg viewBox="0 0 24 24" className="doc-icon-svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
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
                      <div className="action-menu-wrapper">
                        <button
                          className="action-btn"
                          onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                        >
                          <svg viewBox="0 0 24 24" className="dots-icon-svg"><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>
                        </button>

                        {activeMenuId === row.id && (
                          <div className="action-dropdown-menu">
                            <button className="dropdown-item" onClick={() => handleGoruntule(row.id)}>
                              <svg viewBox="0 0 24 24" className="dropdown-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              Görüntüle
                            </button>
                            <button className="dropdown-item" onClick={() => handleDuzenle(row)}>
                              <svg viewBox="0 0 24 24" className="dropdown-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              Değişiklik Yap
                            </button>
                            <button className="dropdown-item delete" onClick={() => handleSil(row.id)}>
                              <svg viewBox="0 0 24 24" className="dropdown-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              Sil
                            </button>
                          </div>
                        )}
                      </div>
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