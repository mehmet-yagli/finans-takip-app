const mongoose = require('mongoose');

// Yorum Şeması (Post içinde gömülü olacak)
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Yorum boş olamaz'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Gönderi Şeması
const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Başlık zorunludur'],
    trim: true,
    maxlength: [100, 'Başlık en fazla 100 karakter olabilir']
  },
  content: {
    type: String,
    required: [true, 'İçerik zorunludur']
  },
  tags: {
    type: [String], // Örn: ["Borsa", "Tasarruf"]
    default: []
  },
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  comments: [commentSchema] // Yorumları buraya gömüyoruz
}, {
  timestamps: true // createdAt ve updatedAt otomatik oluşur
});

module.exports = mongoose.model('Post', postSchema);