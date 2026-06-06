const mongoose = require('mongoose');

// Transaction şeması
const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,  // Kullanıcı ID'si
    ref: 'User',  // User modeline referans
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'investment'],  
    required: [true, 'İşlem tipi zorunludur']
  },
  category: {
    type: String,
    required: [true, 'Kategori zorunludur'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Tutar zorunludur'],
    min: [0, 'Tutar negatif olamaz']
  },
  description: {
    type: String,
    trim: true,
    default: ''  // Varsayılan değer boş string
  },
  date: {
    type: Date,
    default: Date.now  // Varsayılan olarak şu anki tarih
  },
  // Düzenli İşlem (Otomasyon) Mantığı
  isRecurring: {
    type: Boolean,
    default: false // Varsayılan olarak normal, tek seferlik işlem
  },
  recurringDay: {
    type: Number,
    min: 1,
    max: 31,
    default: null // Sadece isRecurring true ise bu alanın bir değeri (Örn: 15) olacak
  },
  // 👇 YENİ EKLENEN ALANLAR: Yatırım (Investment) Mantığı İçin
  symbol: {
    type: String,
    trim: true,
    default: null // Örn: BTC, THYAO
  },
  assetName: {
    type: String,
    trim: true,
    default: null // Örn: Bitcoin, Türk Hava Yolları
  },
  purchasePrice: {
    type: Number,
    default: null // Alış Fiyatı (₺/$)
  }
}, {
  timestamps: true
});

// İndeksler - Sorguları hızlandırır
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, isRecurring: 1 }); // Düzenli işlemleri hızlı çekmek için eklendi

module.exports = mongoose.model('Transaction', transactionSchema);