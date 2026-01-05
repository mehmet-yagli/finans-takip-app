const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // 👇 EKLENDİ: Şifre karşılaştırma ve hashleme için
const User = require('../models/User');
const auth = require('../middleware/auth');

// JWT Token oluştur
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'  // 30 gün geçerli
  });
};

// @route   POST /api/auth/register
// @desc    Kullanıcı kaydı
// @access  Public (herkes erişebilir)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validasyon - tüm alanlar dolu mu?
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Lütfen tüm alanları doldurun' });
    }
    
    // Email zaten kayıtlı mı?
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Bu email zaten kayıtlı' });
    }
    
    // Yeni kullanıcı oluştur
    const user = await User.create({
      name,
      email,
      password  // Model'de otomatik hash'lenecek (pre save hook)
    });
    
    // Token oluştur
    const token = generateToken(user._id);
    
    // Başarılı cevap
    res.status(201).json({
      message: 'Kayıt başarılı',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Register hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/auth/login
// @desc    Kullanıcı girişi
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validasyon
    if (!email || !password) {
      return res.status(400).json({ message: 'Email ve şifre gerekli' });
    }
    
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }
    
    // Şifre kontrolü (Model'deki comparePassword metodu)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz email veya şifre' });
    }
    
    // Token oluştur
    const token = generateToken(user._id);
    
    // Başarılı cevap
    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Login hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/auth/me
// @desc    Giriş yapmış kullanıcının bilgilerini getir
// @access  Private (token gerekli)
router.get('/me', auth, async (req, res) => {
  try {
    // req.user middleware'den geliyor
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Get user hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 👇 YENİ EKLENEN ROTA: Profil Güncelleme
// @route   PUT /api/auth/update
// @desc    Kullanıcı bilgilerini ve şifresini güncelle
// @access  Private
router.put('/update', auth, async (req, res) => {
  const { name, email, password, newPassword } = req.body;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
    }

    // İsim ve Email güncelleme
    if (name) user.name = name;
    if (email) user.email = email;

    // Şifre Değiştirme İsteği Varsa
    if (password && newPassword) {
      // 1. Mevcut şifreyi kontrol et (Database'deki hash ile kıyasla)
      // Not: User modelinde comparePassword metodu varsa onu da kullanabilirdik ama burada manuel bcrypt kullandık.
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Mevcut şifreniz hatalı' });
      }
      
      // 2. Yeni şifreyi hashle
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Güncel kullanıcı bilgisini döndür
    res.json({
      msg: 'Profil başarıyla güncellendi',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Profil güncelleme hatası:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;