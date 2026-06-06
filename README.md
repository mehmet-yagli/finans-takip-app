# 🐋 WhaleStreet: AI Destekli Finans & Portföy Ekosistemi

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Stack](https://img.shields.io/badge/Stack-MERN-important.svg)
![Mobile](https://img.shields.io/badge/Mobile-React_Native_(Expo)-000000?logo=expo)
![AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-8E75B2)

Kişisel finansal verileri takip etmek, yatırımları yönetmek ve finansal okuryazarlığı artırmak için geliştirilmiş, uçtan uca (Web + Mobil + API) çalışan **akıllı bir finans platformudur**. 

MERN stack mimarisi üzerine inşa edilen WhaleStreet, kullanıcılarına sadece bir bütçe defteri sunmakla kalmaz; içerdiği yapay zeka asistanı ile kişiselleştirilmiş bir finans danışmanlığı deneyimi yaşatır.

---

## 📸 Ürün Görselleri

### 🔹 Web Dashboard & Analiz
Kullanıcının gelir/gider durumunu, net varlığını ve harcama analizlerini grafiklerle sunduğu ana ekran.
*(Buraya web arayüzünden bir ekran görüntüsü ekleyin)*

### 🔹 Mobil Deneyim (React Native)
Finansal verilere her an her yerden ulaşabilmek için tasarlanmış akıcı mobil arayüz.
*(Buraya Expo uygulamasından bir ekran görüntüsü ekleyin)*

### 🔹 Whale-E: Yapay Zeka Finans Asistanı
Google Gemini 2.5 Flash motoru ile desteklenen, portföy analizi yapan ve finansal terimleri açıklayan entegre chatbot.
*(Buraya chat penceresinin bir ekran görüntüsü ekleyin)*

---

## 🚀 Temel Özellikler

* **🤖 AI Finans Asistanı (Whale-E):** Portföy durumunu okuyup kişiselleştirilmiş finansal tavsiyeler veren, "Bileşik faiz nedir?" gibi soruları yanıtlayan akıllı asistan.
* **📱 Çoklu Platform Desteği:** Aynı veritabanı ile senkronize çalışan Web (React/Vite) ve Mobil (Expo) uygulamaları.
* **💰 Dinamik Varlık Yönetimi:** Altın, Döviz, Kripto Para ve Hisse Senetleri için anlık kâr/zarar ve toplam net değer hesaplaması.
* **📊 Detaylı Bütçe Analizi:** Aylık gelir-gider takibi, kategori bazlı harcama dağılımı (Recharts).
* **👥 Topluluk & Sosyal Etkileşim:** Kullanıcıların finansal konuları tartışabileceği entegre forum yapısı.
* **🔐 Üst Düzey Güvenlik:** JWT tabanlı kimlik doğrulama ve güvenli API rotaları.

---

## 🛠️ Mimari ve Teknolojiler

### Frontend (Web)
* **React.js (Vite):** Yüksek performanslı ve modern UI geliştirme.
* **Tailwind CSS & Framer Motion:** Responsive tasarım ve akıcı "Glassmorphism" animasyonlar.
* **Recharts:** Etkileşimli veri görselleştirme.

### Mobile (Uygulama)
* **React Native & Expo:** Tek kod tabanı ile iOS ve Android çıktısı alma.
* **Expo Router:** Modern dosya tabanlı mobil yönlendirme (routing).

### Backend & Yapay Zeka
* **Node.js & Express.js:** RESTful API mimarisi ve MVC tasarım deseni.
* **MongoDB & Mongoose:** Esnek NoSQL veritabanı modellemesi.
* **Google Generative AI:** Gemini 2.5 Flash model entegrasyonu.

---

## 📦 Kurulum ve Çalıştırma (Lokal)

Projeyi kendi bilgisayarınızda test etmek için aşağıdaki adımları izleyebilirsiniz:

1. **Repoyu Klonlayın**
```bash
   git clone [https://github.com/mehmet-yagli/finans-takip-app.git](https://github.com/mehmet-yagli/finans-takip-app.git)
   cd finans-takip-app
Backend'i Başlatın

Bash
   cd backend
   npm install
   # .env.example dosyasını .env olarak kopyalayıp değişkenlerinizi (MongoDB, Gemini vb.) girin.
   npm run dev
Web Arayüzünü Başlatın

Bash
   cd ../frontend
   npm install
   # .env.example dosyasını .env olarak kopyalayın.
   npm run dev
Mobil Uygulamayı Başlatın (İsteğe Bağlı)

Bash
   cd ../mobile
   npm install
   # Telefonunuza 'Expo Go' uygulamasını indirin.
   npx expo start
   # Terminalde çıkan QR kodu telefonunuzdan okutun.
🔮 Yol Haritası (Gelecek Güncellemeler)
[ ] Banka API entegrasyonları ile otomatik banka ekstresi okuma.

[ ] Kullanıcılara e-posta ile haftalık/aylık otomatik bütçe raporları gönderimi.

[ ] Portföy hedefleri (Örn: "Ev Peşinatı", "Araba") için gamification (oyunlaştırma) özellikleri.

👨‍💻 Geliştirici: Mehmet Yağlı

💡 Kategori: Finansal Teknoloji (FinTech) & Yapay Zeka
