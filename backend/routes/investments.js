const express = require('express');
const router = express.Router();
const axios = require('axios');
const Investment = require('../models/Investments');
const auth = require('../middleware/auth');
const yahooFinance = require('yahoo-finance2').default;

// --- 1. GET ROUTE (LİSTELEME) ---
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    
    const investments = await Investment.find(filter).sort({ createdAt: -1 });
    
    let totalInvested = 0;
    let totalCurrentValue = 0;
    
    investments.forEach(inv => {
      totalInvested += inv.amount * inv.buyPrice;
      const currentPrice = inv.currentPrice > 0 ? inv.currentPrice : inv.buyPrice;
      totalCurrentValue += inv.amount * currentPrice;
    });
    
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercentage = totalInvested > 0 
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;
    
    res.json({
      count: investments.length,
      investments,
      summary: { totalInvested, totalCurrentValue, totalProfitLoss, totalProfitLossPercentage: totalProfitLossPercentage.toFixed(2) }
    });
  } catch (error) {
    console.error('Get Error:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// --- 2. GET SINGLE ITEM ---
router.get('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Bulunamadı' });
    if (investment.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Yetkisiz' });
    res.json(investment);
  } catch (error) { res.status(500).json({ message: 'Hata' }); }
});

// --- 3. POST (EKLEME) ---
router.post('/', auth, async (req, res) => {
  try {
    const { type, symbol, name, amount, buyPrice, buyDate, notes, currency } = req.body;
    
    const numAmount = parseFloat(amount);
    const numBuyPrice = parseFloat(buyPrice);

    if (!type || !symbol || !name || isNaN(numAmount) || isNaN(numBuyPrice)) {
      return res.status(400).json({ message: 'Eksik bilgi' });
    }
    
    const investment = new Investment({
      user: req.user._id,
      type,
      symbol: symbol.toUpperCase().trim(),
      name: name.trim(),
      amount: numAmount,
      buyPrice: numBuyPrice,
      currency: currency || 'USD',
      buyDate: buyDate || Date.now(),
      notes: notes || ''
    });
    
    // Fiyat çekmeyi dene
    try {
      console.log(`🆕 Yeni Varlık Ekleniyor: ${investment.symbol} (${investment.type})`);
      const result = await getSmartPrice(investment.type, investment.symbol);
      
      if (result.price > 0) {
          investment.currentPrice = result.price;
          
          if (result.detectedType && result.detectedType !== type) {
              investment.type = result.detectedType;
          }
          // Eğer sistem para birimini bulduysa (Örn: Gram Altın için TRY) onu kullan
          if (result.detectedCurrency && result.detectedCurrency !== investment.currency) {
              investment.currency = result.detectedCurrency;
          }
          investment.lastUpdated = new Date();
      } else {
          investment.currentPrice = numBuyPrice;
      }
    } catch (priceError) {
      console.error("Fiyat çekme hatası:", priceError);
      investment.currentPrice = numBuyPrice;
    }
    
    await investment.save();
    res.status(201).json({ message: 'Eklendi', investment });
  } catch (error) {
    console.error("POST Error:", error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// --- 4. PUT (GÜNCELLEME) ---
router.put('/:id', auth, async (req, res) => {
  try {
    let investment = await Investment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Bulunamadı' });
    if (investment.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Yetkisiz' });
    
    const { type, symbol, name, amount, buyPrice, currency } = req.body;
    const updateFields = {};
    
    if (type) updateFields.type = type;
    if (symbol) updateFields.symbol = symbol.toUpperCase().trim();
    if (name) updateFields.name = name.trim();
    if (currency) updateFields.currency = currency;
    if (amount !== undefined) updateFields.amount = parseFloat(amount);
    if (buyPrice !== undefined) updateFields.buyPrice = parseFloat(buyPrice);
    
    investment = await Investment.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    
    try {
        const result = await getSmartPrice(investment.type, investment.symbol);
        if(result.price > 0) {
            investment.currentPrice = result.price;
            if (result.detectedType) investment.type = result.detectedType;
            if (result.detectedCurrency) investment.currency = result.detectedCurrency;
            investment.lastUpdated = new Date();
            await investment.save();
        }
    } catch(e) {}

    res.json({ message: 'Güncellendi', investment });
  } catch (error) { res.status(500).json({ message: 'Hata' }); }
});

// --- 5. DELETE ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Bulunamadı' });
    if (investment.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Yetkisiz' });
    await Investment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Silindi' });
  } catch (error) { res.status(500).json({ message: 'Hata' }); }
});

// --- 6. TOPLU FİYAT GÜNCELLEME ---
router.put('/update-prices/all', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id });
    let updatedCount = 0;
    
    console.log(`🔄 Toplu Güncelleme Başladı: ${investments.length} varlık`);

    for (const investment of investments) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const result = await getSmartPrice(investment.type, investment.symbol);
        
        if (result.price > 0) {
            investment.currentPrice = result.price;
            if (result.detectedType && result.detectedType !== investment.type) investment.type = result.detectedType;
            
            // Para birimi değiştiyse güncelle
            if (result.detectedCurrency) {
                 investment.currency = result.detectedCurrency;
            }

            investment.lastUpdated = new Date();
            await investment.save();
            updatedCount++;
        }
      } catch (error) { console.error(`❌ Hata (${investment.symbol}):`, error.message); }
    }
    res.json({ message: 'Tamamlandı', updatedCount, total: investments.length });
  } catch (error) { res.status(500).json({ message: 'Hata' }); }
});

// --- 7. TEKLİ FİYAT GÜNCELLEME ---
router.put('/:id/update-price', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Bulunamadı' });
    
    console.log(`🔄 Tekli Güncelleme: ${investment.symbol}`);
    const result = await getSmartPrice(investment.type, investment.symbol);
    
    if (result.price > 0) {
        investment.currentPrice = result.price;
        if (result.detectedType) investment.type = result.detectedType;
        if (result.detectedCurrency) investment.currency = result.detectedCurrency;
        
        investment.lastUpdated = new Date();
        await investment.save();
        res.json({ message: 'Güncellendi', investment });
    } else {
        res.json({ message: 'Fiyat güncel (Değişim yok veya API hatası)', investment });
    }
  } catch (error) { res.status(500).json({ message: 'Hata' }); }
});

// 🔥🔥🔥 ULTRA AKILLI FİYAT MOTORU (GRAM TL DÜZELTİLDİ) 🔥🔥🔥
async function getSmartPrice(type, symbol) {
  const upperSymbol = symbol.toUpperCase().replace(/\s/g, ''); 

  // 1. ÖZEL DURUM: GRAM ALTIN HESAPLAMA (TRY BAZLI!)
  if (['ALTIN', 'GOLD', 'XAU', 'GRAMALTIN', 'GRAM'].includes(upperSymbol)) {
      console.log(`🥇 Gram Altın Hesaplanıyor...`);
      // Önce ONS fiyatını (Dolar) çek
      const goldOunce = await getYahooPriceWithFallback('GC=F'); 
      
      if (goldOunce.price > 0) {
          const gramPriceUSD = goldOunce.price / 31.1035; // Ons -> Gram Dolar

          // 🔥 ŞİMDİ DOLAR KURUNU ÇEKİP TL'YE ÇEVİRİYORUZ 🔥
          // USDTRY=X Yahoo'da Dolar/TL kurudur
          const usdTryRate = await getYahooPriceWithFallback('USDTRY=X');
          
          if (usdTryRate.price > 0) {
              const gramPriceTRY = gramPriceUSD * usdTryRate.price;
              console.log(`💱 Altın TL Çevrimi: ${gramPriceUSD.toFixed(2)} $ * ${usdTryRate.price} = ${gramPriceTRY.toFixed(2)} ₺`);
              return { 
                  price: gramPriceTRY, 
                  detectedType: 'commodity', 
                  detectedCurrency: 'TRY' // ARTIK TL OLARAK KAYDEDİLECEK
              };
          }

          // Kur çekilemezse Dolar olarak dön (Fallback)
          return { price: gramPriceUSD, detectedType: 'commodity', detectedCurrency: 'USD' };
      }
  }

  // 2. DİĞER EMTİALAR
  // Altını buradan çıkarttım ki üstteki Gram hesaplamasına takılsın.
  const commodityMap = {
      'GÜMÜŞ': 'SI=F', 'SILVER': 'SI=F', 'XAG': 'SI=F',
      'PETROL': 'CL=F', 'OIL': 'CL=F', 'WTI': 'CL=F', 'BRENT': 'BZ=F'
  };
  
  if (commodityMap[upperSymbol] || type === 'commodity') {
      const ticker = commodityMap[upperSymbol] || symbol; 
      const yahooResult = await getYahooPriceWithFallback(ticker);
      if (yahooResult.price > 0) {
          return { ...yahooResult, detectedType: 'commodity' };
      }
  }

  // 3. KRİPTO
  if (type === 'crypto') {
    try {
        const coinId = getCoinGeckoId(symbol);
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, { timeout: 3000 });
        if (response.data && response.data[coinId]) {
          return { price: response.data[coinId].usd, detectedType: 'crypto', detectedCurrency: 'USD' };
        }
    } catch (err) { }
    
    const cryptoSymbol = symbol.includes('-USD') ? symbol : `${symbol}-USD`;
    const yahooCrypto = await getYahooPriceWithFallback(cryptoSymbol);
    if (yahooCrypto.price > 0) return { ...yahooCrypto, detectedType: 'crypto', detectedCurrency: 'USD' };
  }

  // 4. HİSSE SENEDİ (STOCK)
  const stockResult = await getSmartStockPrice(symbol);
  if (stockResult.price > 0) return stockResult;

  return { price: 0 };
}

// 🛠️ YARDIMCI: Akıllı Hisse Arayıcı
async function getSmartStockPrice(symbol) {
    const symbolsToTry = [symbol];
    if (!symbol.includes('.')) symbolsToTry.push(`${symbol}.IS`);

    for (const s of symbolsToTry) {
        const result = await getYahooPriceWithFallback(s);
        if (result.price > 0) {
            return { ...result, detectedType: 'stock' };
        }
    }
    return { price: 0 };
}

// 🛠️ YARDIMCI: Yahoo Finance (Kütüphane + Raw API Fallback)
async function getYahooPriceWithFallback(ticker) {
    try {
        const quote = await yahooFinance.quote(ticker, { validateResult: false });
        if (quote && quote.regularMarketPrice) {
            let currency = 'USD';
            if (quote.currency === 'TRY' || ticker.includes('.IS')) currency = 'TRY';
            return { price: quote.regularMarketPrice, detectedCurrency: currency };
        }
    } catch (e) { }

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const meta = res.data?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
            console.log(`✅ RAW API Buldu: ${ticker} -> ${meta.regularMarketPrice}`);
            return { price: meta.regularMarketPrice, detectedCurrency: meta.currency };
        }
    } catch (e2) { console.error(`❌ RAW API de başarısız (${ticker}):`, e2.message); }

    return { price: 0 };
}

function getCoinGeckoId(symbol) {
  const mapping = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'XRP': 'ripple', 
    'ADA': 'cardano', 'SOL': 'solana', 'DOT': 'polkadot', 'DOGE': 'dogecoin', 
    'AVAX': 'avalanche-2', 'MATIC': 'matic-network', 'TRX': 'tron', 'USDT': 'tether',
    'PEPE': 'pepe', 'SHIB': 'shiba-inu'
  };
  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
}

module.exports = router;