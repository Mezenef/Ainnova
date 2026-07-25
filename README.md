# 🚀 Ainnova Content Studio

<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/React-Frontend-blue?style=for-the-badge&logo=react"/>
  <img src="https://img.shields.io/badge/Django-Backend-green?style=for-the-badge&logo=django"/>
  <img src="https://img.shields.io/badge/REST%20API-Integrated-orange?style=for-the-badge"/>
</p>


## 📌 Proje Hakkında

**Ainnova Content Studio**, markaların dijital içerik üretim süreçlerini kolaylaştırmak amacıyla geliştirilmiş yapay zeka destekli bir dijital pazarlama platformudur.

Platform sayesinde kullanıcılar;

- Marka kimliği oluşturabilir,
- İçerik fikirleri geliştirebilir,
- Pazarlama içerikleri üretebilir,
- İçeriklerini yönetebilir,
- Takvim üzerinden planlama yapabilir,
- Geçmiş içeriklerini analiz edebilir,
- Kişisel arayüz tercihlerini yönetebilir.


---

# ✨ Özellikler

## 🔐 Kullanıcı Yönetimi

✅ JWT tabanlı güvenli giriş sistemi  
✅ Kullanıcı doğrulama  
✅ Oturum yönetimi  
✅ Beni hatırla özelliği  


## 🎨 Kişiselleştirilebilir Arayüz

Kullanıcılar kendi deneyimlerini özelleştirebilir:

- 🌙 Karanlık / Açık tema
- 🎨 Vurgu rengi değiştirme
- 🔤 Yazı tipi seçimi
- 🌈 Renk doygunluğu ayarı


## 📝 İçerik Yönetimi

- İçerik oluşturma
- İçerik geçmişi görüntüleme
- İçerik detaylarını yönetme
- Pazarlama içeriklerinin saklanması


## 📅 İçerik Takvimi

- Günlük planlama
- Haftalık görünüm
- Aylık görünüm
- İçerik zamanlama
- Takvim tabanlı yönetim


## 📊 Dashboard

Kullanıcı panelinde:

- İçerik istatistikleri
- Üretim durumu
- Marka bilgileri
- Hızlı erişim alanları


---
             USER
              |
              |
        React Frontend
              |
              |
         REST API
              |
              |
        Django Backend
              |
              |
          Database




---

# 🛠️ Kullanılan Teknolojiler


## Frontend

| Teknoloji | Kullanım |
|-|-|
| React.js | Kullanıcı arayüzü |
| Vite | Frontend build sistemi |
| JavaScript (ES6+) | Uygulama geliştirme |
| Axios | API bağlantıları |
| React Router | Sayfa yönlendirme |
| Context API | Global state yönetimi |
| Lucide React | Modern ikon sistemi |
| CSS3 | Tasarım ve stillendirme |


---

## Backend

| Teknoloji | Kullanım |
|-|-|
| Python | Backend dili |
| Django 5 | Web framework |
| Django REST Framework | REST API geliştirme |
| Simple JWT | Token authentication |
| SQLite | Veri tabanı |
| Django ORM | Veri yönetimi |


---

# 📂 Proje Yapısı

Ainnova/
│
├── backend/
│   │
│   ├── ainnova_marketing/
│   │   │
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   │
│   ├── marketing_api/
│   │   │
│   │   ├── migrations/
│   │   │   └── Veritabanı migration dosyaları
│   │   │
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests.py
│   │
│   │
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
│
├── frontend/
│   │
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   │
│   ├── src/
│   │   │
│   │   ├── api/
│   │   │   └── axios.js
│   │   │
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   │
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   └── MainLayout.css
│   │   │
│   │   ├── pages/
│   │   │   │
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   │
│   │   │   ├── Kayit.jsx
│   │   │   ├── Kayit.css
│   │   │   │
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.css
│   │   │   │
│   │   │   ├── IcerikUret.jsx
│   │   │   ├── IcerikUret.css
│   │   │   │
│   │   │   ├── Takvim.jsx
│   │   │   ├── Takvim.css
│   │   │   │
│   │   │   ├── Gecmis.jsx
│   │   │   ├── Gecmis.css
│   │   │   │
│   │   │   ├── Sonuclar.jsx
│   │   │   ├── Sonuclar.css
│   │   │   │
│   │   │   ├── Ayarlar.jsx
│   │   │   ├── Ayarlar.css
│   │   │   │
│   │   │   ├── Dogrulama.jsx
│   │   │   └── Dogrulama.css
│   │   │
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
│
├── README.md
└── .gitignore



TEKNOLOJİLER

Frontend:
- React.js
- Vite
- JavaScript ES6+
- Axios
- React Router
- Context API
- Lucide React
- CSS3


Backend:
- Python
- Django 5
- Django REST Framework
- Simple JWT Authentication
- SQLite Database
- Django ORM



GENEL MİMARİ


Kullanıcı
   |
   |
React Frontend
   |
   |
Axios REST İletişimi
   |
   |
Django Backend
   |
   |
Database



# 🏗️ Sistem Mimarisi

