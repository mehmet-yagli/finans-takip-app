const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
// 👇 DÜZELTME: Dosya adın 'Investments.js' olduğu için 's' takısı korundu.
const Investment = require('../models/Investments'); 
const OpenAI = require('openai'); 

// 👇 YENİ: Market servisinden canlı veri çeken fonksiyonu dahil ettik
// (Bunun çalışması için market.js dosyasında 'getMarketData' fonksiyonunu export etmiş olman lazım)
const { getMarketData } = require('./market'); 

// --- ⚙️ GÜVENLİ KURULUM ---
// OpenAI Key varsa bağlanır, yoksa sadece aşağıdaki Yerel Kütüphane'yi kullanır.
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.log("⚠️ OpenAI API Key yok. Bot 'Yerel Kütüphane' modunda çalışacak.");
}

// =================================================================
// 📚 BÜYÜK YEREL BİLGİ BANKASI (KNOWLEDGE BASE)
// Burası botun beynidir. İnternet olmasa bile buradaki her şeyi bilir.
// =================================================================
const KNOWLEDGE_BASE = [
  // --- 🌟 ÖZEL: YETENEK TANITIMI & YARDIM MENÜSÜ ---
  {
    keywords: ['neler', 'yapabilirsin', 'yetenek', 'yardım', 'menu', 'komut', 'özellik', 'soru', 'yapabildiklerin'],
    response: "🤖 **Merhaba! Ben Finans Asistanın. İşte yapabildiklerim:**\n\n" +
              "📊 **Portföy Analizi:**\n- 'Finansal durumum nedir?'\n- 'Nakit akışım nasıl?'\n- 'Zengin miyim?'\n\n" +
              "🧠 **Finans Sözlüğü (Eğitim):**\n- 'Enflasyon nedir?'\n- 'Bileşik faiz nasıl çalışır?'\n- 'BES mantıklı mı?'\n- 'Ayı piyasası ne demek?'\n\n" +
              "🌍 **Piyasa Verileri:**\n- 'Dolar ne kadar?'\n- 'Altın fiyatı nedir?'\n\n" +
              "⚙️ **Uygulama Rehberi:**\n- 'Şifremi değiştirmek istiyorum'\n- 'Yatırım nasıl eklenir?'\n- 'Karanlık moda geç'\n\n" +
              "💡 *İpucu: Bana bir arkadaşınmışım gibi soru sorabilirsin!*",
    action: null
  },

  // --- 📱 UYGULAMA KULLANIMI (NAVİGASYON DÜZELTİLDİ) ---
  {
    keywords: ['şifre', 'parola', 'değiştir', 'güvenlik', 'hesap güvenliği'],
    response: "🔐 **Şifre İşlemleri:**\nHesap güvenliğin bizim için önemli. Şifreni değiştirmek için seni **Ayarlar** sayfasına yönlendiriyorum. Orada 'Güvenlik' sekmesini göreceksin.",
    action: '/settings' // Frontend'de hata vermemesi için ana sayfaya yönlendiriyoruz
  },
  {
    keywords: ['avatar', 'resim', 'profil', 'fotoğraf', 'kullanıcı adı', 'mail', 'eposta', 'bilgilerim'],
    response: "👤 **Profil Düzenleme:**\nProfil fotoğrafını, ismini veya mail adresini güncellemek için **Ayarlar** sayfasına gidebilirsin.",
    action: '/settings'
  },
  {
    keywords: ['tema', 'karanlık', 'gece', 'mod', 'beyaz', 'siyah', 'göz', 'dark'],
    response: "🌙 **Tema Ayarları:**\nUygulamayı göz yormayan moda almak için sol alt köşedeki **'Karanlık Mod'** butonunu kullanabilirsin. Tekrar basarsan aydınlık moda döner.",
    action: null
  },
  {
    keywords: ['çıkış', 'log out', 'logout', 'kapat', 'hesaptan çık'],
    response: "🚪 **Çıkış Yap:**\nOturumu kapatmak için sol menünün en altındaki **Çıkış Yap** butonuna basabilirsin. Seni tekrar bekliyoruz! 👋",
    action: null
  },
  {
    keywords: ['yatırım ekle', 'yeni yatırım', 'varlık gir', 'altın aldım', 'dolar aldım', 'hisse ekle'],
    response: "📈 **Yatırım Ekleme:**\nPortföyüne yeni bir varlık eklemek için **Yatırımlar** sayfasına git ve sağ üstteki mavi **'+ Yatırım Ekle'** butonunu kullan.",
    action: '/investments'
  },
  {
    keywords: ['harcama', 'gelir', 'gider', 'fiş', 'fatura', 'maaş', 'işlem ekle'],
    response: "💸 **Gelir/Gider Ekleme:**\nCüzdanına bir harcama veya gelir işlemek için **Ana Sayfa (Genel Bakış)** ekranındaki mavi butonu kullanabilirsin.",
    action: '/dashboard'
  },
  {
    keywords: ['bütçe', 'limit', 'uyarı', 'kota', 'sınır', 'tasarruf hedefi'],
    response: "📊 **Bütçe Yönetimi:**\nHarcamalarını kontrol altına almak için **Ayarlar** sayfasına gidip 'Bütçe' sekmesini kullanabilirsin. Limitlerini aşarsan seni uyarırım!",
    action: '/settings'
  },
  {
    keywords: ['topluluk', 'forum', 'sosyal', 'chat', 'sohbet', 'başkaları', 'yorumlar'],
    response: "👥 **Topluluk:**\nDiğer yatırımcıların neler konuştuğunu görmek ve fikir alışverişi yapmak için **Topluluk** sayfasına göz atabilirsin.",
    action: '/community'
  },

  // --- 🎓 FİNANS SÖZLÜĞÜ (GENİŞLETİLMİŞ İÇERİK) ---
  {
    keywords: ['enflasyon', 'hayat pahalılığı', 'zam', 'alım gücü'],
    response: "📉 **Enflasyon Nedir?**\nEnflasyon, paranın zamanla değer kaybetmesidir. Bugün 100 TL'ye aldığın şeyi seneye 150 TL'ye alıyorsan paran erimiş demektir. Korunmak için paranı nakitte tutmak yerine yatırıma (Altın, Borsa vb.) yönlendirmelisin.",
    action: null
  },
  {
    keywords: ['faiz', 'getiri', 'mevduat', 'politika faizi'],
    response: "🏦 **Faiz Nedir?**\nFaiz, paranın kirasıdır. Bankaya paranı koyarsan sana kira (mevduat faizi) öder. Kredi çekersen sen bankaya kira (kredi faizi) ödersin.",
    action: null
  },
  {
    keywords: ['temettü', 'kar payı', 'hisse geliri', 'düzenli gelir'],
    response: "💰 **Temettü (Kâr Payı):**\nBir şirketin kazandığı parayı ortaklarıyla paylaşmasıdır. 'Temettü Emekliliği' diye bir kavram vardır; düzenli hisse biriktirerek maaş gibi gelir elde edebilirsin.",
    action: null
  },
  {
    keywords: ['bileşik', 'bileşik faiz', 'sihir', 'katlama'],
    response: "🚀 **Bileşik Getiri (Dünyanın 8. Harikası):**\nKazandığın paranın da tekrar kazanmasıdır. Kar topu etkisi gibidir; başta yavaş büyür ama zamanla devasa bir servete dönüşür. Sabır gerektirir.",
    action: null
  },
  {
    keywords: ['sepet', 'çeşitlendirme', 'diversifikasyon', 'risk yönetimi'],
    response: "🥚 **Yatırım Sepeti:**\n'Bütün yumurtaları aynı sepete koyma!' Paranla sadece altın alma; biraz dolar, biraz hisse, biraz da nakit tut. Biri düşerken diğeri seni kurtarır.",
    action: null
  },
  {
    keywords: ['boğa', 'ayı', 'bull', 'bear', 'yükseliş', 'düşüş'],
    response: "🐂 **Boğa ve Ayı Piyasası:**\n- **Boğa (Bull):** Piyasanın coşkulu olduğu, fiyatların sürekli yükseldiği dönem.\n- **Ayı (Bear):** Fiyatların düştüğü, herkesin korktuğu ve sattığı dönem.",
    action: null
  },
  {
    keywords: ['stop loss', 'zarar kes', 'stop', 'limit emir'],
    response: "🛑 **Stop-Loss (Zarar Kes):**\n'Kol kesmek' gibidir. Zarar büyümeden işlemi otomatik kapatmaktır. Duygusal davranmanı engeller ve sermayeni korur.",
    action: null
  },
  {
    keywords: ['bes', 'bireysel emeklilik', 'devlet katkısı'],
    response: "👴 **BES (Bireysel Emeklilik):**\nUzun vadeli bir tasarruf sistemidir. En büyük avantajı %30 devlet katkısıdır. Yani sen 1000 TL yatırırsan devlet de senin için 300 TL yatırır. Uzun vade için harikadır.",
    action: null
  },
  {
    keywords: ['kredi notu', 'findeks', 'puan', 'sicil'],
    response: "📝 **Kredi Notu:**\nBankaların sana ne kadar güvenebileceğini gösteren puandır. Borçlarını zamanında ödersen yükselir. Yüksek not = Kolay kredi ve düşük faiz demektir.",
    action: null
  },
  {
    keywords: ['acil durum', 'fon', 'yedek akçe', 'kenara para'],
    response: "🚨 **Acil Durum Fonu:**\nİşsiz kalma veya ani sağlık sorunları için kenarda tutman gereken 3-6 aylık giderin kadar nakit paradır. Bu para yatırıma bağlanmaz, her an çekilebilir olmalıdır.",
    action: null
  },

  // --- 💡 SOHBET VE TAVSİYELER ---
  {
    keywords: ['nasıl zengin', 'zengin olmak', 'para kazanmak', 'tavsiye ver'],
    response: "💎 **Zenginliğin Kısa Yolu Yoktur ama Formülü Vardır:**\n1. Gelirinden az harca.\n2. Arta kalanı hemen yatırıma dönüştür.\n3. Sabırlı ol (Bileşik getiriye izin ver).\n4. Kendine yatırım yap ve gelirini artır.",
    action: null
  },
  {
    keywords: ['borç', 'kredi kartı', 'eksi hesap'],
    response: "💳 **Önce Borçlar!**\nEğer yüksek faizli kredi kartı borcun varsa, yatırım yapmadan önce mutlaka bunları kapatmalısın. Borç faizi genelde yatırım getirisinden yüksektir.",
    action: null
  },
  {
    keywords: ['merhaba', 'selam', 'hey', 'naber', 'nasıl', 'günaydın', 'iyi geceler'],
    response: "Merhaba! 👋 Ben senin Finans Asistanınım. Enerjim yerinde! 💪\nSana bütçen, piyasalar veya finansal terimler hakkında yardımcı olabilirim. **'Neler yapabilirsin?'** diye sorabilirsin.",
    action: null
  },
  {
    keywords: ['kimsin', 'nesin', 'adın ne'],
    response: "🤖 Ben **FinansTakip AI** asistanıyım. Amacım senin finansal özgürlüğe ulaşmana yardımcı olmak. 7/24 buradayım, uyumam ve acıkmam!",
    action: null
  },
  {
    keywords: ['teşekkür', 'sağ ol', 'süper', 'harika', 'tamam', 'ok'],
    response: "Rica ederim! 😊 Yardımcı olabildiysem ne mutlu bana. Bol kazançlar dilerim!",
    action: null
  }
];

// --- 🛠️ HESAPLAMA MOTORU (FİNANSAL DURUM) ---
async function calculateFinancialStatus(userId) {
  // Veritabanından verileri çek
  const transactions = await Transaction.find({ user: userId });
  const investments = await Investment.find({ user: userId });

  // Hata önleyici: Eğer veri yoksa hata vermesin, 0 kabul etsin.
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);
  const cashBalance = income - expense;

  // 👇 GÜNCELLEME: CANLI KUR ÇEKME İŞLEMİ
  // Varsayılan bir değer tutuyoruz, API çalışmazsa bu kullanılır.
  let USD_RATE = 43.03; 
  try {
      // Market.js'deki fonksiyonu çağırıp canlı veriyi alıyoruz
      const marketData = await getMarketData(); 
      if (marketData && marketData.rates && marketData.rates.TRY) {
          USD_RATE = marketData.rates.TRY;
          // console.log("AI: Canlı Dolar Kuru Alındı ->", USD_RATE); // Test için açılabilir
      }
  } catch (e) {
      console.log("AI: Canlı kur alınamadı, yedek değer kullanılıyor.");
  }

  let totalInvestmentValueTRY = 0;

  // Yatırımları Değerle
  investments.forEach(inv => {
    // Varsa güncel fiyatı, yoksa alış fiyatını baz al
    const effectivePrice = (inv.currentPrice && inv.currentPrice > 0) ? inv.currentPrice : inv.buyPrice;
    const amount = inv.amount || 0;
    
    // Değeri hesapla
    const rawValue = amount * effectivePrice;

    // Kura göre TL'ye çevir
    if (inv.currency === 'USD') {
      totalInvestmentValueTRY += (rawValue * USD_RATE);
    } else {
      totalInvestmentValueTRY += rawValue;
    }
  });

  const totalNetWorth = cashBalance + totalInvestmentValueTRY;

  // Return değerine usdRate'i de ekledik ki kullanıcıya hangi kuru kullandığımızı söyleyelim
  return { income, expense, cashBalance, totalInvestmentValueTRY, totalNetWorth, usdRate: USD_RATE };
}

// Kütüphane Arama Fonksiyonu
function findInKnowledgeBase(message) {
  const lowerMsg = message.toLowerCase();
  
  // Mesajın içindeki kelimelerden herhangi biri kütüphanedeki anahtar kelimelerle eşleşiyor mu?
  return KNOWLEDGE_BASE.find(topic => 
    topic.keywords.some(keyword => lowerMsg.includes(keyword))
  );
}

// --- 🚀 MAIN ROUTE (CHATBOT MERKEZİ) ---
router.post('/chat', auth, async (req, res) => {
  const { message } = req.body;
  
  // Boş mesaj gelirse koruma
  if (!message) return res.json({ type: 'general', answer: "Bir şeyler yazmalısın ki yardımcı olabileyim. 😊" });

  const lowerMsg = message.toLowerCase();

  try {
    // 1. ADIM: DİNAMİK VERİ ANALİZİ (Özel Kodlar)
    // Bu sorular için veritabanına gitmek zorundayız.
    
    // A) Finansal Özet İsteği
    if (['durum', 'özet', 'analiz', 'para', 'bütçe', 'zengin', 'fakir', 'varlık', 'portföy', 'nakit'].some(k => lowerMsg.includes(k))) {
      const status = await calculateFinancialStatus(req.user.id);

      // Cevapta kullanılan Dolar kurunu da gösteriyoruz
      let responseText = `💼 **Finansal Portföy Raporun (Kur: ${status.usdRate.toFixed(2)} ₺):**\n\n`;
      responseText += `💵 **Cüzdan (Nakit):** ${status.cashBalance.toLocaleString('tr-TR')} ₺\n`;
      responseText += `📈 **Yatırımlar:** ~${status.totalInvestmentValueTRY.toLocaleString('tr-TR')} ₺\n`;
      responseText += `💰 **Toplam Servet:** ${status.totalNetWorth.toLocaleString('tr-TR')} ₺\n\n`;

      // Duruma göre akıllı yorum yap
      if (status.cashBalance < 0) {
        responseText += `⚠️ **Uyarı:** Nakit akışın ekside (-${Math.abs(status.cashBalance)} ₺). Lütfen harcamalarını gözden geçir.`;
      } else if (status.totalInvestmentValueTRY > status.cashBalance) {
        responseText += `🚀 **Tebrikler:** Varlıklarının çoğu yatırımlarda çalışıyor. Parayı çalıştırmayı biliyorsun!`;
      } else {
        responseText += `💡 **Öneri:** Elinde çok nakit var. Enflasyon riskine karşı bir kısmını yatırıma dönüştürebilirsin.`;
      }
      return res.json({ type: 'analysis', answer: responseText });
    }

    // B) Piyasa İsteği - CANLI VERİ ENTEGRASYONU
    if (['dolar', 'euro', 'altın', 'bitcoin', 'piyasa', 'kur', 'borsa'].some(k => lowerMsg.includes(k))) {
        try {
            const marketData = await getMarketData();
            const tryRate = marketData.rates.TRY.toFixed(2);
            // Euro API'de USD bazlı geldiği için (USD/TRY) / (USD/EUR) hesabı yapılır
            const eurRate = (marketData.rates.TRY / marketData.rates.EUR).toFixed(2); 
            const btc = marketData.crypto.find(c => c.id === 'bitcoin');
            
            return res.json({ 
                type: 'market', 
                answer: `📊 **Canlı Piyasa Verileri:**\n\n🇺🇸 Dolar/TL: ${tryRate} ₺\n🇪🇺 Euro/TL: ~${eurRate} ₺\n₿ Bitcoin: $${btc ? btc.current_price.toLocaleString() : '---'}\n\nDetaylı canlı veriler için **Piyasa** sayfasına bakabilirsin.`,
                action: '/market'
            });
        } catch (e) {
            // Hata olursa (API çökmesi vb.) eski statik cevabı dön (Fallback)
             return res.json({ 
                type: 'market', 
                answer: "⚠️ Anlık verilere ulaşamadım ama normalde Dolar 43-45 bandında. Lütfen **Piyasa** sayfasını kontrol et.",
                action: '/market'
            });
        }
    }

    // 2. ADIM: YEREL KÜTÜPHANE TARAMASI (Bedava & Hızlı)
    // Yukarıdaki dinamik sorular değilse, kütüphaneye bakar.
    const libraryResult = findInKnowledgeBase(message);
    if (libraryResult) {
      return res.json({ 
        type: 'guide', 
        answer: libraryResult.response, 
        action: libraryResult.action 
      });
    }

    // 3. ADIM: YAPAY ZEKA (OpenAI - Sadece Key Varsa)
    if (openai) {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "Sen yardımsever, samimi ve motive edici bir finans asistanısın. Türkçe cevap ver." },
              { role: "user", content: message }
            ],
            max_tokens: 150,
        });
        return res.json({ type: 'ai', answer: completion.choices[0].message.content });
    } 
    
    // 4. ADIM: HİÇBİR ŞEY BULUNAMADI (Fallback - Yardım Menüsüne Yönlendirme)
    else {
        return res.json({ 
            type: 'general',
            answer: "🤔 Bunu henüz öğrenmedim.\n\nAma **'Neler yapabilirsin?'** diye sorarsan sana yeteneklerimi listeleyebilirim!\n\nŞunları deneyebilirsin:\n- 'Bütçe durumum nedir?'\n- 'Enflasyon nedir?'\n- 'Şifremi değiştirmek istiyorum'" 
        });
    }

  } catch (err) {
    console.error("AI Error:", err.message);
    return res.json({ type: 'error', answer: "Bir hata oluştu, lütfen tekrar dene." });
  }
});

module.exports = router;