const mongoose = require('mongoose');

// Yatırım şeması
const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['crypto', 'stock', 'commodity'],  // Kripto, hisse, emtia
    required: [true, 'Yatırım tipi zorunludur']
  },
  symbol: {
    type: String,
    required: [true, 'Sembol zorunludur'],
    uppercase: true,  // BTC, ETH, AEFES -> büyük harf
    trim: true
  },
  name: {
    type: String,
    required: [true, 'İsim zorunludur'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Miktar zorunludur'],
    min: [0, 'Miktar negatif olamaz']
  },
  buyPrice: {
    type: Number,
    required: [true, 'Alış fiyatı zorunludur'],
    min: [0, 'Alış fiyatı negatif olamaz']
  },
  // 🛠️ YENİ EKLENEN ALAN: PARA BİRİMİ
  currency: {
    type: String,
    enum: ['USD', 'TRY'],
    default: 'USD',
    required: true
  },
  buyDate: {
    type: Date,
    default: Date.now
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

// Virtual field - Toplam yatırım tutarı
investmentSchema.virtual('totalInvested').get(function() {
  return this.amount * this.buyPrice;
});

// Virtual field - Güncel değer
investmentSchema.virtual('currentValue').get(function() {
  return this.amount * this.currentPrice;
});

// Virtual field - Kar/Zarar
investmentSchema.virtual('profitLoss').get(function() {
  return this.currentValue - this.totalInvested;
});

// Virtual field - Kar/Zarar yüzdesi
investmentSchema.virtual('profitLossPercentage').get(function() {
  if (this.buyPrice === 0) return 0;
  return ((this.currentPrice - this.buyPrice) / this.buyPrice) * 100;
});

// JSON'a çevirirken virtual field'ları da dahil et
investmentSchema.set('toJSON', { virtuals: true });
investmentSchema.set('toObject', { virtuals: true });

// İndeksler
investmentSchema.index({ user: 1, type: 1 });
investmentSchema.index({ user: 1, symbol: 1 });

module.exports = mongoose.model('Investment', investmentSchema);