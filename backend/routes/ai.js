const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investments'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Market servisinden canlı veri çeken fonksiyon
const { getMarketData } = require('./market'); 

// --- ⚙️ GEMINI KURULUMU (2026 Güncel Modeller) ---
let genAI;
let model;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // 🌟 GÜNCELLEME: Hesabında aktif olan en yeni model gemini-2.5-flash olarak değiştirildi.
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
  console.log("✅ WhaleStreet AI: Gemini 2.5 Flash motoru bağlandı.");
} else {
  console.log("⚠️ GEMINI_API_KEY bulunamadı. Bot 'Yerel Kütüphane' modunda çalışacak.");
}

// =================================================================
// 📚 BÜYÜK YEREL BİLGİ BANKASI (KNOWLEDGE BASE)
// =================================================================
const KNOWLEDGE_BASE = [
  {
    keywords: ['neler', 'yapabilirsin', 'yetenek', 'yardım', 'menu', 'komut', 'özellik', 'soru', 'yapabildiklerin'],
    response: "🤖 **Merhaba! Ben WhaleStreet Finans Asistanın. İşte yapabildiklerim:**\n\n" +
              "📊 **Portföy Analizi:**\n- 'Finansal durumum nedir?'\n- 'Nakit akışım nasıl?'\n\n" +
              "🧠 **Finans Sözlüğü (Eğitim):**\n- 'Enflasyon nedir?'\n- 'Bileşik faiz nasıl çalışır?'\n\n" +
              "🌍 **Piyasa Verileri:**\n- 'Dolar ne kadar?'\n- 'Altın fiyatı nedir?'\n\n" +
              "⚙️ **Uygulama Rehberi:**\n- 'Şifremi değiştirmek istiyorum'\n- 'Yatırım nasıl eklenir?'\n\n" +
              "💡 *İpucu: Bana gerçek bir finans danışmanıymışım gibi soru sorabilirsin!*",
    action: null
  },
  {
    keywords: ['şifre', 'parola', 'değiştir', 'güvenlik', 'hesap güvenliği'],
    response: "🔐 **Şifre İşlemleri:**\nHesap güvenliğin bizim için önemli. Şifreni değiştirmek için seni **Ayarlar** sayfasına yönlendiriyorum. Orada 'Güvenlik' sekmesini göreceksin.",
    action: '/settings'
  },
  {
    keywords: ['avatar', 'resim', 'profil', 'fotoğraf', 'kullanıcı adı', 'mail', 'eposta', 'bilgilerim'],
    response: "👤 **Profil Düzenleme:**\nProfil bilgilerinizi güncellemek için **Ayarlar** sayfasına gidebilirsin.",
    action: '/settings'
  },
  {
    keywords: ['tema', 'karanlık', 'gece', 'mod', 'beyaz', 'siyah', 'göz', 'dark'],
    response: "🌙 **Tema Ayarları:**\nUygulamayı göz yormayan moda almak için sol alt köşedeki **'Karanlık Mod'** butonunu kullanabilirsin.",
    action: null
  },
  {
    keywords: ['çıkış', 'log out', 'logout', 'kapat', 'hesaptan çık'],
    response: "🚪 **Çıkış Yap:**\nOturumu kapatmak için sol menünün en altındaki **Çıkış Yap** butonuna basabilirsin.",
    action: null
  },
  {
    keywords: ['yatırım ekle', 'yeni yatırım', 'varlık gir', 'altın aldım', 'dolar aldım', 'hisse ekle'],
    response: "📈 **Yatırım Ekleme:**\nPortföyüne yeni bir varlık eklemek için **Yatırımlar** sayfasına git ve sağ üstteki mavi **'+ Yatırım Ekle'** butonunu kullan.",
    action: '/investments'
  },
  {
    keywords: ['harcama', 'gelir', 'gider', 'fiş', 'fatura', 'maaş', 'işlem ekle'],
    response: "💸 **Gelir/Gider Ekleme:**\nİşlem eklemek için **Ana Sayfa** ekranındaki mavi butonu kullanabilirsin.",
    action: '/dashboard'
  },
  {
    keywords: ['bütçe', 'limit', 'uyarı', 'kota', 'sınır', 'tasarruf hedefi'],
    response: "📊 **Bütçe Yönetimi:**\nHarcama limitlerini **Ayarlar > Bütçe** sekmesinden yönetebilirsin.",
    action: '/settings'
  },
  {
    keywords: ['topluluk', 'forum', 'sosyal', 'chat', 'sohbet', 'başkaları', 'yorumlar'],
    response: "👥 **Topluluk:**\nDiğer yatırımcılarla fikir alışverişi yapmak için **Topluluk** sayfasına göz atabilirsin.",
    action: '/community'
  },
  {
    keywords: ['enflasyon', 'hayat pahalılığı', 'zam', 'alım gücü'],
    response: "📉 **Enflasyon Nedir?**\nEnflasyon, paranın zamanla değer kaybetmesidir. Korunmak için paranı nakitte tutmak yerine yatırıma (Altın, Borsa vb.) yönlendirmelisin.",
    action: null
  },
  {
    keywords: ['faiz', 'getiri', 'mevduat', 'politika faizi'],
    response: "🏦 **Faiz Nedir?**\nFaiz, paranın kirasıdır. Bankaya paranı koyarsan sana kira (mevduat faizi) öder.",
    action: null
  },
  {
    keywords: ['temettü', 'kar payı', 'hisse geliri', 'düzenli gelir'],
    response: "💰 **Temettü (Kâr Payı):**\nBir şirketin kazandığı parayı ortaklarıyla paylaşmasıdır. Düzenli hisse biriktirerek pasif gelir elde edebilirsin.",
    action: null
  },
  {
    keywords: ['bileşik', 'bileşik faiz', 'sihir', 'katlama'],
    response: "🚀 **Bileşik Getiri:**\nKazandığın paranın da tekrar kazanmasıdır. Kar topu etkisi gibidir; zamanla devasa bir servete dönüşür.",
    action: null
  },
  {
    keywords: ['merhaba', 'selam', 'hey', 'naber', 'nasıl', 'günaydın'],
    response: "Merhaba! 👋 Ben senin WhaleStreet Finans Asistanınım. Enerjim yerinde! 💪 Sana nasıl yardımcı olabilirim?",
    action: null
  }
];

// --- 🛠️ HESAPLAMA MOTORU (FİNANSAL DURUM) ---
async function calculateFinancialStatus(userId) {
  const transactions = await Transaction.find({ user: userId });
  const investments = await Investment.find({ user: userId });

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);
  const cashBalance = income - expense;

  let USD_RATE = 45.19; 
  try {
      const marketData = await getMarketData(); 
      if (marketData && marketData.rates && marketData.rates.TRY) {
          USD_RATE = marketData.rates.TRY;
      }
  } catch (e) {
      console.log("AI: Canlı kur alınamadı, yedek değer kullanılıyor.");
  }

  let totalInvestmentValueTRY = 0;
  investments.forEach(inv => {
    const effectivePrice = (inv.currentPrice && inv.currentPrice > 0) ? inv.currentPrice : inv.buyPrice;
    const amount = inv.amount || 0;
    const rawValue = amount * effectivePrice;

    if (inv.currency === 'USD') {
      totalInvestmentValueTRY += (rawValue * USD_RATE);
    } else {
      totalInvestmentValueTRY += rawValue;
    }
  });

  const totalNetWorth = cashBalance + totalInvestmentValueTRY;
  return { income, expense, cashBalance, totalInvestmentValueTRY, totalNetWorth, usdRate: USD_RATE };
}

function findInKnowledgeBase(message) {
  const lowerMsg = message.toLowerCase();
  return KNOWLEDGE_BASE.find(topic => 
    topic.keywords.some(keyword => lowerMsg.includes(keyword))
  );
}

// --- 🚀 MAIN ROUTE (CHATBOT MERKEZİ) ---
router.post('/chat', auth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ answer: "Bir şeyler yazmalısın ki yardımcı olabileyim. 😊" });

  const lowerMsg = message.toLowerCase();

  try {
    // 1. ADIM: DİNAMİK VERİ ANALİZİ
    if (['durum', 'özet', 'analiz', 'para', 'bütçe', 'varlık', 'portföy', 'nakit'].some(k => lowerMsg.includes(k))) {
      const status = await calculateFinancialStatus(req.user.id);
      let responseText = `💼 **Portföy Analizin (Güncel Kur: ${status.usdRate.toFixed(2)} ₺):**\n\n`;
      responseText += `💵 **Nakit Bakiyen:** ${status.cashBalance.toLocaleString('tr-TR')} ₺\n`;
      responseText += `📈 **Yatırımların:** ~${status.totalInvestmentValueTRY.toLocaleString('tr-TR')} ₺\n`;
      responseText += `💰 **Toplam Varlık:** ${status.totalNetWorth.toLocaleString('tr-TR')} ₺\n\n`;

      if (status.cashBalance < 0) {
        responseText += `⚠️ **Uyarı:** Harcamaların gelirini aşmış durumda. Bütçe yönetimi sayfasından limitlerini kontrol etmelisin.`;
      } else {
        responseText += `🚀 **Harika:** Finansal durumun dengeli ilerliyor. WhaleStreet ile büyümeye devam!`;
      }
      return res.json({ type: 'analysis', answer: responseText });
    }

    // 2. ADIM: YEREL KÜTÜPHANE TARAMASI
    const libraryResult = findInKnowledgeBase(message);
    if (libraryResult) {
      return res.json({ type: 'guide', answer: libraryResult.response, action: libraryResult.action });
    }

    // 3. ADIM: GEMINI 2.5 FLASH YAPAY ZEKA
    if (model) {
        const userStatus = await calculateFinancialStatus(req.user.id);
        const contextPrompt = `Sen WhaleStreet finans platformunun resmi yapay zeka asistanısın. 
        Kullanıcı Adı: ${req.user.name}.
        Kullanıcının Finansal Özeti: Nakit ${userStatus.cashBalance} TL, Yatırım ${userStatus.totalInvestmentValueTRY} TL.
        Görevin: Kullanıcıya finansal okuryazarlık kazandırmak ve portföyü hakkında motive edici, kısa yorumlar yapmak.
        Dil: Türkçe. Samimi ama profesyonel bir ton kullan.
        
        Kullanıcının Mesajı: "${message}"`;

        const result = await model.generateContent(contextPrompt);
        const response = await result.response;
        return res.json({ type: 'ai', answer: response.text() });
    } 
    
    else {
        return res.json({ 
            answer: "Gemini bağlantısında bir sorun oldu. Lütfen internetini kontrol et veya biraz sonra tekrar dene!" 
        });
    }

  } catch (err) {
    console.error("AI Error:", err.message);
    return res.json({ answer: "WhaleStreet AI şu an yoğun, lütfen tekrar dene." });
  }
});

module.exports = router;