import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './MainLayout.css';
import { useTheme } from '../context/ThemeContext';
import api from "../api/axios";


const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(!!(localStorage.getItem("access") || sessionStorage.getItem("access")));
const [user, setUser] = useState({ name: '' });

useEffect(() => {
  const token = localStorage.getItem("access") || sessionStorage.getItem("access");
  setIsLoggedIn(!!token);
  if (token) {
    api.get("me/")
      .then((res) => {
        const adSoyad = `${res.data.first_name || ''} ${res.data.last_name || ''}`.trim();
        setUser({ name: adSoyad || res.data.username });
      })
      .catch((err) => console.error("Kullanıcı bilgisi alınamadı:", err));
  }
}, []);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/ayarlar');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  sessionStorage.removeItem("access");
  sessionStorage.removeItem("refresh");
  navigate("/login");
};

  return (
    <div className={`layout-container ${isDarkMode ? 'dark-theme' : ''}`}>
      <aside className="sidebar">
        <div
          className="sidebar-header"
          onClick={() => navigate('/dashboard')}
        >
          <div className="logo-icon-small">A</div>
          <span className="logo-text"><strong>Ainnova</strong><br/>Content Studio</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" className="nav-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/uret" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" className="nav-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>İçerik Üret</span>
          </NavLink>

          <NavLink to="/gecmis" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" className="nav-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span>Sonuçlarım</span>
          </NavLink>

          <NavLink to="/takvim" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" className="nav-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>Takvim</span>
          </NavLink>

          <NavLink to="/ayarlar" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" className="nav-icon"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>Ayarlar</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/yardim" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <svg viewBox="0 0 24 24" className="nav-icon"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>Yardım</span>
          </NavLink>
          <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <svg viewBox="0 0 24 24" className="nav-icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Çıkış Yap</span>
          </a>

          <div className="pro-upgrade-card">
            <svg viewBox="0 0 24 24" className="crown-icon"><path d="M2 4h20v2H2z"></path><path d="M2 8l4 12h12l4-12-6 4-4-6-4 6z"></path></svg>
            <h4>Upgrade to Pro</h4>
            <p>Daha fazla özellikle üretkenliğini artır.</p>
            <button>→</button>
          </div>
        </div>
      </aside>

      <div className="main-content-wrapper">
        <header className="top-navbar">
          

          <div className="navbar-actions">

            <div className="notification-wrapper">
              <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <svg viewBox="0 0 24 24" className="nav-action-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>

                {isLoggedIn && notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h4>Bildirimler</h4>
                  </div>

                  {!isLoggedIn ? (
                    <div className="notification-empty">
                      <span className="empty-icon">🔒</span>
                      <p>Bildirimleri görmek için giriş yapın.</p>
                      <button onClick={() => navigate('/login')} className="btn-text-action">Giriş Yap →</button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                      <span className="empty-icon">📭</span>
                      <p>Henüz bildirim yok.</p>
                    </div>
                  ) : (
                    <ul>
                      {notifications.map((notif, index) => (
                        <li key={index}>
                          <span className={`dot ${notif.isRead ? '' : 'unread'}`}></span>
                          {notif.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button className="icon-btn" onClick={toggleTheme}>
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" className="nav-action-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="nav-action-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              )}
            </button>

            <div className="user-profile" onClick={handleProfileClick}>
              {isLoggedIn ? (
                <>
                  <div className="avatar-img empty-avatar">
                    <svg viewBox="0 0 24 24" className="user-placeholder-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <span className="profile-name">{user.name} ⌄</span>
                </>
              ) : (
                <>
                  <div className="avatar-img empty-avatar">
                    <svg viewBox="0 0 24 24" className="user-placeholder-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <span className="profile-name">Giriş Yap</span>
                </>
              )}
            </div>

          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;