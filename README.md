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

```text
Ainnova/
│
├── backend/
│   │
│   ├── ainnova_marketing/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── marketing_api/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── agent_service/
│   │   ├── gemini_client.py
│   │   ├── prompts.py
│   │   └── schemas.py
│   │
│   ├── manage.py
│   ├── requirements.txt
│   └── .env (gitignore'da, repoya dahil değil)
│
├── frontend/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   │
│   │   ├── context/
│   │   │   └── ThemeContext.jsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   └── MainLayout.css
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Kayit.jsx
│   │   │   ├── SifremiUnuttum.jsx
│   │   │   ├── SifreSifirla.jsx
│   │   │   ├── Dogrulama.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── IcerikUret.jsx
│   │   │   ├── Takvim.jsx
│   │   │   ├── Gecmis.jsx
│   │   │   ├── Sonuclar.jsx
│   │   │   ├── Ayarlar.jsx
│   │   │   └── Yardim.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
```



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




