const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth'); 

// Basit bir "In-Memory" Cache (Önbellek) Sistemi
let marketCache = {
  data: null,
  lastFetch: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 Dakika

// --- 🛠️ YENİ: Dışarıdan Çağrılabilir Veri Fonksiyonu ---
// Bu fonksiyonu hem aşağıdaki route kullanacak hem de AI modülü kullanacak.
const getMarketData = async () => {
  const currentTime = Date.now();

  // 1. Cache Kontrolü
  if (marketCache.data && (currentTime - marketCache.lastFetch < CACHE_DURATION)) {
    return marketCache.data;
  }

  // 2. Yeni Veri Çekme
  console.log('🔄 Servis: Piyasa verisi güncelleniyor...');
  
  try {
      // CoinGecko
      const cryptoRes = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: 'bitcoin,ethereum,tether,solana,binancecoin,ripple,cardano,avalanche-2',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: true 
        },
        timeout: 5000 
      });

      // Frankfurter (Döviz)
      const forexRes = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR,TRY,GBP,JPY', {
          timeout: 5000
      });

      const newData = {
        crypto: cryptoRes.data,
        rates: forexRes.data.rates, 
        lastUpdated: currentTime
      };

      // Cache Güncelle
      marketCache = {
        data: newData,
        lastFetch: currentTime
      };

      return newData;

  } catch (error) {
      console.error('Market Service Hatası:', error.message);
      // Hata varsa ve cache doluysa eskiyi dön
      if (marketCache.data) return marketCache.data;
      throw error;
  }
};

// @route   GET /api/market
router.get('/', async (req, res) => {
  try {
    const data = await getMarketData(); // Yukarıdaki ortak fonksiyonu kullan
    res.json(data);
  } catch (error) {
    res.status(500).json({ msg: 'Piyasa verilerine şu an ulaşılamıyor.' });
  }
});

// 👇 ÖNEMLİ: Router'ı export ederken yanına fonksiyonu da ekliyoruz
module.exports = router;
module.exports.getMarketData = getMarketData;