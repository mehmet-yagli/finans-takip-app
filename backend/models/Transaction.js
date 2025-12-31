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
    enum: ['income', 'expense'],  // Sadece bu iki değer olabilir
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
  }
}, {
  timestamps: true
});

// İndeksler - Sorguları hızlandırır
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);