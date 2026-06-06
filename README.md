# 💰 Finans Takip & Portföy Yönetim Sistemi

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Live-success.svg)
![Stack](https://img.shields.io/badge/MERN-Stack-important.svg)

Kişisel finansal verileri takip etmek, yatırımları yönetmek ve piyasa verilerini anlık izlemek için geliştirilmiş kapsamlı bir **Full-Stack Web Uygulaması**.

🔗 **Canlı Demo:** [https://finans-app-frontend.onrender.com](https://finans-app-frontend.onrender.com)

---

## 📸 Proje Görselleri

### 🔹 Dashboard (Genel Bakış)
Kullanıcının gelir/gider durumunu, net varlığını ve harcama analizlerini grafiklerle sunduğu ana ekran.
![Dashboard Görünümü](screenshots/dashboard-dark.png) 
*(Buraya image_49ea28.png gibi bir görseli isimlendirip koy)*

### 🔹 Yatırım Portföyü & Kâr/Zarar Analizi
Kripto, Altın ve Hisse senedi yatırımlarının anlık takibi.
![Yatırımlar](screenshots/yatirimlar.png)

### 🔹 Piyasa Merkezi & Yapay Zeka Asistanı
Canlı döviz kurları, piyasa algısı ve portföy tavsiyesi veren entegre AI Chatbot.
![Piyasa ve AI](screenshots/piyasa-ai.png)

---

## 🚀 Özellikler

* **📊 Detaylı Dashboard:** Aylık gelir-gider takibi, kategori bazlı harcama pasta grafikleri (Recharts).
* **💰 Varlık Yönetimi:** Altın, Döviz, Kripto Para ve Hisse Senetleri için anlık kâr/zarar hesaplaması.
* **🤖 AI Finans Asistanı:** Portföy durumuna göre kişiselleştirilmiş finansal tavsiyeler veren yapay zeka entegrasyonu.
* **🌍 Canlı Piyasa Verileri:** Anlık döviz kurları ve kripto para fiyat takibi.
* **👥 Topluluk & Forum:** Kullanıcıların finansal konuları tartışabileceği sosyal etkileşim alanı.
* **📅 Abonelik Takibi:** Netflix, Spotify gibi düzenli ödemelerin takibi ve hatırlatmaları.
* **🔐 Güvenlik:** JWT (JSON Web Token) tabanlı güvenli kimlik doğrulama sistemi.
* **🌓 Tema Desteği:** Kullanıcı dostu Dark/Light mod seçeneği.

---

## 🛠️ Kullanılan Teknolojiler

### Frontend (Ön Yüz)
* **React.js (Vite):** Hızlı ve modern UI geliştirme.
* **Tailwind CSS:** Responsive ve şık tasarım.
* **Recharts:** Veri görselleştirme ve grafikler.
* **Axios:** API istek yönetimi.

### Backend (Arka Plan)
* **Node.js & Express.js:** RESTful API mimarisi.
* **MongoDB & Mongoose:** NoSQL veritabanı modellemesi.
* **JWT (JSON Web Token):** Güvenli oturum yönetimi.
* **Cors & Dotenv:** Güvenlik ve ortam değişkenleri.

---

## 📦 Kurulum (Local)

Projeyi yerel bilgisayarınızda çalıştırmak için:

1.  **Projeyi Klonlayın**
    ```bash
    git clone [https://github.com/KULLANICI_ADIN/finans-takip-app.git](https://github.com/KULLANICI_ADIN/finans-takip-app.git)
    cd finans-takip-app
    ```

2.  **Bağımlılıkları Yükleyin**
    ```bash
    # Backend için
    cd backend
    npm install

    # Frontend için
    cd ../frontend
    npm install
    ```

3.  **Çevresel Değişkenleri (.env) Ayarlayın**
    `backend` klasöründe `.env` dosyası oluşturun ve gerekli API anahtarlarını (MONGO_URI, JWT_SECRET vb.) girin.

4.  **Projeyi Başlatın**
    ```bash
    # Backend'i başlat
    cd backend
    npm start

    # Frontend'i başlat
    cd frontend
    npm run dev
    ```

---

## 🔮 Gelecek Güncellemeler
* [ ] Mobil uygulama (React Native) sürümü.
* [ ] Banka API entegrasyonları ile otomatik harcama çekme.
* [ ] E-posta ile haftalık bütçe raporları.

---

👨‍💻 **Geliştirici:** Mehmet Yağlı  
📧 **İletişim:** admin@gmail.com (veya senin gerçek mailin)