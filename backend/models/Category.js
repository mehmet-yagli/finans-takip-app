const mongoose = require('mongoose');

// Kategori şeması
const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Kategori adı zorunludur'],
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Kategori tipi zorunludur']
  },
  icon: {
    type: String,
    default: '📁'  // Varsayılan ikon
  },
  color: {
    type: String,
    default: '#3B82F6'  // Varsayılan renk (mavi)
  }
}, {
  timestamps: true
});

// Aynı kullanıcı, aynı isimde ve tipte kategori oluşturamaz
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);