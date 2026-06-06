// backend/models/Subscription.js
const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true, // Örn: Netflix, Spotify
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['TRY', 'USD', 'EUR'],
    default: 'TRY'
  },
  paymentDay: {
    type: Number, // Her ayın kaçında çekiliyor? (1-31 arası)
    required: true
  },
  category: {
    type: String,
    default: 'Entertainment' // Entertainment, Software, Utility vb.
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 👇 YENİ EKLENEN ALAN: Mobildeki o şık renkli ikonları veritabanından beslemek için
  color: {
    type: String,
    default: '#3B82F6' // Varsayılan WhaleStreet mavisi
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);