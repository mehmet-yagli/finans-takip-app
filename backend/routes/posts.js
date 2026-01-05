const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');

// @route   POST /api/posts
// @desc    Yeni bir tartışma/gönderi oluştur
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    // Basit validasyon
    if (!title || !content) {
      return res.status(400).json({ message: 'Başlık ve içerik zorunludur' });
    }

    const newPost = new Post({
      user: req.user._id,
      title,
      content,
      tags: tags || []
    });

    const post = await newPost.save();
    
    // Frontend'de kullanıcının ismini göstermek için populate ediyoruz
    await post.populate('user', 'name');
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Create post hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts
// @desc    Tüm gönderileri getir (En yeniden eskiye)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // En yeni en üstte
      .populate('user', 'name') // Gönderi sahibinin ismini al
      .populate('comments.user', 'name'); // Yorum yapanların ismini al

    res.json(posts);
  } catch (error) {
    console.error('Get posts hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 👇 YENİ EKLENEN ROTA: LİDER TABLOSU
// @route   GET /api/posts/leaderboard
// @desc    En aktif kullanıcıları getir (Post sayısına göre)
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const leaderboard = await Post.aggregate([
      {
        $group: {
          _id: "$user", // Kullanıcı ID'sine göre grupla
          postCount: { $sum: 1 } // Her post için 1 topla
        }
      },
      { $sort: { postCount: -1 } }, // En çoktan en aza sırala
      { $limit: 5 }, // İlk 5 kişiyi al
      {
        $lookup: { // User tablosundan isimleri çek
          from: "users", // MongoDB'deki koleksiyon adı (genelde küçük harf ve çoğul)
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" }, // Diziyi objeye çevir
      {
        $project: { // Sadece gerekli alanları al ve puan hesapla
          name: "$userInfo.name",
          points: { $multiply: ["$postCount", 50] } // 1 Post = 50 Puan
        }
      }
    ]);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});
// 👆 YENİ EKLENEN ROTA SONU

// @route   PUT /api/posts/like/:id
// @desc    Gönderiyi beğen veya beğenmekten vazgeç (Toggle)
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Kullanıcı daha önce beğenmiş mi kontrol et
    const isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());

    if (isLiked) {
      // Zaten beğenmişse, beğeniyi kaldır (Unlike)
      post.likes = post.likes.filter(
        ({ user }) => user.toString() !== req.user._id.toString()
      );
    } else {
      // Beğenmemişse, beğeni ekle (Like)
      post.likes.unshift({ user: req.user._id });
    }

    await post.save();
    res.json(post.likes); // Güncel beğeni listesini dön
  } catch (error) {
    console.error('Like hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/posts/comment/:id
// @desc    Gönderiye yorum yap
// @access  Private
router.post('/comment/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: 'Yorum metni zorunludur' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    const newComment = {
      user: req.user._id,
      text,
      date: Date.now()
    };

    post.comments.push(newComment); // Sona ekle

    await post.save();
    
    // Tüm yorumları kullanıcı isimleriyle döndür ki anlık güncelleyebilelim
    const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'name');
    
    res.json(updatedPost.comments);
  } catch (error) {
    console.error('Comment hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 👇 YENİ EKLENEN SİLME ROTASI (DELETE ROUTE)
// @route   DELETE /api/posts/:id
// @desc    Gönderiyi sil (Sadece sahibi silebilir)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // 1. Gönderi var mı?
    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // 2. Silmeye çalışan kişi, gönderinin sahibi mi?
    // req.user._id (giriş yapan) ile post.user (sahibi) karşılaştırılır
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Bu gönderiyi silmeye yetkiniz yok' });
    }

    // 3. Silme işlemi
    await post.deleteOne();

    res.json({ message: 'Gönderi başarıyla silindi' });
  } catch (error) {
    console.error('Delete post hatası:', error.message);
    // Eğer ID formatı geçersizse de 404 dönmeli
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});
// 👆 SİLME ROTASI SONU

module.exports = router;