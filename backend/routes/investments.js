const express = require('express');
const router = express.Router();
const axios = require('axios');
const Investment = require('../models/Investments');
const auth = require('../middleware/auth');

// Tüm route'lar auth middleware ile korumalı

// @route   GET /api/investments
// @desc    Kullanıcının tüm yatırımlarını getir
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;  // crypto veya stock filtresi
    
    // Filtre oluştur
    const filter = { user: req.user._id };
    if (type) {
      if (type !== 'crypto' && type !== 'stock') {
        return res.status(400).json({ 
          message: 'Type parametresi "crypto" veya "stock" olmalıdır' 
        });
      }
      filter.type = type;
    }
    
    // Yatırımları getir
    const investments = await Investment.find(filter).sort({ createdAt: -1 });
    
    // Toplam istatistikler
    let totalInvested = 0;
    let totalCurrentValue = 0;
    
    investments.forEach(inv => {
      totalInvested += inv.totalInvested;
      totalCurrentValue += inv.currentValue;
    });
    
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercentage = totalInvested > 0 
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 
      : 0;
    
    res.json({
      count: investments.length,
      investments,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercentage: totalProfitLossPercentage.toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('Get investments hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/investments/:id
// @desc    Belirli bir yatırımı getir
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    
    if (!investment) {
      return res.status(404).json({ message: 'Yatırım bulunamadı' });
    }
    
    // Yatırım bu kullanıcıya ait mi kontrol et
    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu yatırıma erişim yetkiniz yok' });
    }
    
    res.json(investment);
    
  } catch (error) {
    console.error('Get investment hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Yatırım bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/investments
// @desc    Yeni yatırım ekle
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { type, symbol, name, amount, buyPrice, buyDate, notes } = req.body;
    
    // Validasyon
    if (!type || !symbol || !name || !amount || !buyPrice) {
      return res.status(400).json({ 
        message: 'Tip, sembol, isim, miktar ve alış fiyatı zorunludur' 
      });
    }
    
    // Type kontrolü
    if (!['crypto', 'stock', 'commodity'].includes(type)) {
      return res.status(400).json({ 
        message: 'Tip "crypto", "stock" veya "commodity" olmalıdır' 
      });
    }
    
    // Miktar ve fiyat kontrolü
    if (amount <= 0 || buyPrice <= 0) {
      return res.status(400).json({ 
        message: 'Miktar ve alış fiyatı 0\'dan büyük olmalıdır' 
      });
    }
    
    // Yeni yatırım oluştur
    const investment = new Investment({
      user: req.user._id,
      type,
      symbol: symbol.toUpperCase(),
      name,
      amount,
      buyPrice,
      buyDate: buyDate || Date.now(),
      notes: notes || ''
    });
    
    // Güncel fiyatı al
    try {
      const currentPrice = await getCurrentPrice(type, symbol);
      investment.currentPrice = currentPrice;
      investment.lastUpdated = new Date();
    } catch (priceError) {
      console.log('Fiyat alınamadı:', priceError.message);
      // Fiyat alınamazsa sıfır kalır
    }
    
    await investment.save();
    
    res.status(201).json({
      message: 'Yatırım başarıyla eklendi',
      investment
    });
    
  } catch (error) {
    console.error('Create investment hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/investments/:id
// @desc    Yatırım güncelle
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let investment = await Investment.findById(req.params.id);
    
    if (!investment) {
      return res.status(404).json({ message: 'Yatırım bulunamadı' });
    }
    
    // Yatırım bu kullanıcıya ait mi kontrol et
    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu yatırımı güncelleme yetkiniz yok' });
    }
    
    const { type, symbol, name, amount, buyPrice, buyDate, notes } = req.body;
    
    // Güncellenecek alanlar
    const updateFields = {};
    if (type) {
      if (type !== 'crypto' && type !== 'stock') {
        return res.status(400).json({ 
          message: 'Tip sadece "crypto" veya "stock" olabilir' 
        });
      }
      updateFields.type = type;
    }
    if (symbol) updateFields.symbol = symbol.toUpperCase();
    if (name) updateFields.name = name;
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ 
          message: 'Miktar 0\'dan büyük olmalıdır' 
        });
      }
      updateFields.amount = amount;
    }
    if (buyPrice !== undefined) {
      if (buyPrice <= 0) {
        return res.status(400).json({ 
          message: 'Alış fiyatı 0\'dan büyük olmalıdır' 
        });
      }
      updateFields.buyPrice = buyPrice;
    }
    if (buyDate) updateFields.buyDate = buyDate;
    if (notes !== undefined) updateFields.notes = notes;
    
    // Güncelle
    investment = await Investment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({
      message: 'Yatırım başarıyla güncellendi',
      investment
    });
    
  } catch (error) {
    console.error('Update investment hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Yatırım bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/investments/:id
// @desc    Yatırım sil
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    
    if (!investment) {
      return res.status(404).json({ message: 'Yatırım bulunamadı' });
    }
    
    // Yatırım bu kullanıcıya ait mi kontrol et
    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu yatırımı silme yetkiniz yok' });
    }
    
    await Investment.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Yatırım başarıyla silindi' });
    
  } catch (error) {
    console.error('Delete investment hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Yatırım bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/investments/update-prices/all
// @desc    Tüm yatırımların fiyatlarını güncelle
// @access  Private
router.put('/update-prices/all', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id });
    
    let updatedCount = 0;
    let failedCount = 0;
    
    for (const investment of investments) {
      try {
        const currentPrice = await getCurrentPrice(investment.type, investment.symbol);
        investment.currentPrice = currentPrice;
        investment.lastUpdated = new Date();
        await investment.save();
        updatedCount++;
      } catch (error) {
        console.error(`${investment.symbol} fiyatı güncellenemedi:`, error.message);
        failedCount++;
      }
    }
    
    res.json({
      message: 'Fiyat güncelleme tamamlandı',
      updatedCount,
      failedCount,
      total: investments.length
    });
    
  } catch (error) {
    console.error('Update all prices hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/investments/:id/update-price
// @desc    Belirli bir yatırımın fiyatını güncelle
// @access  Private
router.put('/:id/update-price', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    
    if (!investment) {
      return res.status(404).json({ message: 'Yatırım bulunamadı' });
    }
    
    // Yatırım bu kullanıcıya ait mi kontrol et
    if (investment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu yatırımı güncelleme yetkiniz yok' });
    }
    
    // Güncel fiyatı al
    const currentPrice = await getCurrentPrice(investment.type, investment.symbol);
    investment.currentPrice = currentPrice;
    investment.lastUpdated = new Date();
    await investment.save();
    
    res.json({
      message: 'Fiyat başarıyla güncellendi',
      investment
    });
    
  } catch (error) {
    console.error('Update price hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Yatırım bulunamadı' });
    }
    
    if (error.message.includes('API')) {
      return res.status(503).json({ 
        message: 'Fiyat bilgisi alınamadı. API erişim hatası.' 
      });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yardımcı fonksiyon - Güncel fiyat al
// Yardımcı fonksiyon - Güncel fiyat al
async function getCurrentPrice(type, symbol) {
  try {
    if (type === 'crypto') {
      // CoinGecko API - ÜCRETSİZ
      const coinId = getCoinGeckoId(symbol);
      
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        { 
          timeout: 10000,  // 10 saniye timeout
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      // Cevap kontrolü
      if (!response.data || !response.data[coinId]) {
        console.error(`CoinGecko'dan ${symbol} için veri alınamadı`);
        return 0;
      }
      
      const price = response.data[coinId].usd;
      console.log(`${symbol} fiyatı başarıyla alındı: $${price}`);
      return price;
      
    } else if (type === 'stock') {
      // Hisse senedi - İLERİDE EKLENECEK
      // Alpha Vantage API kullanılacak
      console.log('Hisse senedi fiyatı için API entegrasyonu ileride eklenecek');
      return 0;
      
    } else if (type === 'commodity') {
      // Altın/Gümüş - İLERİDE EKLENECEK
      console.log('Emtia fiyatı için API entegrasyonu ileride eklenecek');
      return 0;
      
    } else {
      console.log(`Bilinmeyen yatırım tipi: ${type}`);
      return 0;
    }
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('API isteği zaman aşımına uğradı (timeout)');
    } else if (error.response) {
      console.error('API hatası:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('API\'ye erişilemiyor - İnternet bağlantısı kontrol edin');
    } else {
      console.error('Fiyat alma hatası:', error.message);
    }
    
    // Hata olsa bile yatırım eklensin, fiyat 0 kalsın
    return 0;
  }
}

// CoinGecko ID mapping (popüler coinler)
function getCoinGeckoId(symbol) {
  const mapping = {
    // Popüler Kriptolar
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'SOL': 'solana',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'LTC': 'litecoin',
    'ATOM': 'cosmos',
    'TRX': 'tron',
    'NEAR': 'near',
    'APT': 'aptos',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'SUI': 'sui',
    
    // Stablecoin'ler
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'BUSD': 'binance-usd'
  };
  
  const symbolUpper = symbol.toUpperCase();
  
  if (mapping[symbolUpper]) {
    return mapping[symbolUpper];
  }
  
  // Mapping'de yoksa küçük harf olarak dene
  console.log(`${symbol} mapping'de bulunamadı, küçük harf olarak deneniyor`);
  return symbol.toLowerCase();
}

module.exports = router;