const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https'); 
const auth = require('../middleware/auth');

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const httpsAgent = new https.Agent({  
  rejectUnauthorized: false 
});

let marketCache = {
  data: null,
  lastFetch: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 Dakika

const getMarketData = async () => {
  const currentTime = Date.now();

  if (marketCache.data && (currentTime - marketCache.lastFetch < CACHE_DURATION)) {
    return marketCache.data;
  }

  console.log('🔄 Servis: Piyasa verisi güncelleniyor...');
  
  try {
      // CoinGecko - Kripto Verileri
      const cryptoRes = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: 'bitcoin,ethereum,tether,solana,binancecoin,ripple,cardano,avalanche-2',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: true
        },
        httpsAgent, 
        timeout: 8000 
      }).catch(e => { console.error("Kripto çekilemedi:", e.message); return { data: [] }; });

      // ER-API - Döviz Kurları (Güncellendi)
      const forexRes = await axios.get('https://open.er-api.com/v6/latest/USD', {
          httpsAgent, 
          timeout: 8000
      }).catch(e => { console.error("Döviz çekilemedi:", e.message); return { data: { rates: {} } }; });

      const popularStocks = [
          { sym: 'THYAO.IS', name: 'Türk Hava Yolları' },
          { sym: 'TUPRS.IS', name: 'Tüpraş' },
          { sym: 'FROTO.IS', name: 'Ford Otosan' },
          { sym: 'SASA.IS', name: 'Sasa Polyester' },
          { sym: 'EREGL.IS', name: 'Ereğli Demir Çelik' },
          { sym: 'AAPL', name: 'Apple Inc.' },
          { sym: 'TSLA', name: 'Tesla Inc.' }
      ];

      const symbolsToFetch = popularStocks.map(s => s.sym);
      let stocks = [];

      try {
          // 🚀 ÇÖZÜM: validateResult parametresini kaldırdık. Sadece diziyi gönderiyoruz.
          const quotes = await yahooFinance.quote(symbolsToFetch);
          const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

          stocks = quotesArray.map(quote => {
              const symConfig = popularStocks.find(s => s.sym === quote.symbol);
              if (!symConfig || !quote.regularMarketPrice) return null;

              const p = quote.regularMarketPrice;
              const c = quote.regularMarketChangePercent || 0;
              const startP = p / (1 + (c / 100)); 
              const sparkline = [startP, startP + (p-startP)*0.2, startP + (p-startP)*0.5, startP + (p-startP)*0.7, p*0.998, p*1.002, p];

              let currency = 'USD';
              if (quote.currency === 'TRY' || quote.symbol.includes('.IS')) currency = 'TRY';

              return {
                  id: quote.symbol.toLowerCase().replace('.is', ''),
                  symbol: quote.symbol.replace('.IS', ''),
                  name: symConfig.name,
                  price: p,
                  change: parseFloat(c.toFixed(2) || 0),
                  currency: currency,
                  marketCap: quote.marketCap,
                  sparkline: sparkline
              };
          }).filter(Boolean); 
      } catch (stockError) {
          console.error("❌ Yahoo Hisse Çekim Hatası:", stockError.message);
      }

      const newData = {
        crypto: cryptoRes.data,
        stocks: stocks, 
        rates: forexRes.data.rates || { TRY: 36.50, EUR: 0.92, GBP: 0.79 },
        lastUpdated: currentTime
      };

      marketCache = { data: newData, lastFetch: currentTime };
      return newData;

  } catch (error) {
      console.error('❌ Market Service Genel Hatası:', error.message);
      if (marketCache.data) return marketCache.data;
      
      return { crypto: [], stocks: [], rates: { TRY: 36.50 }, lastUpdated: currentTime, error: true };
  }
};

router.get('/', async (req, res) => {
  try {
    const data = await getMarketData(); 
    res.json(data);
  } catch (error) {
    res.status(200).json({ msg: 'Piyasa verilerine ulaşılamıyor.', crypto: [], stocks: [], rates: { TRY: 36.50 } });
  }
});

module.exports = router;
module.exports.getMarketData = getMarketData;