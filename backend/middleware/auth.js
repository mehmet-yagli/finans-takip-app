const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token doğrulama middleware'i
const auth = async (req, res, next) => {
  try {
    // Header'dan token'ı al
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Token yoksa hata ver
    if (!token) {
      return res.status(401).json({ 
        message: 'Erişim reddedildi. Lütfen giriş yapın.' 
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı bul (şifre olmadan)
    const user = await User.findById(decoded.id).select('-password');


    // Kullanıcı bulunamazsa
    if (!user) {
      return res.status(401).json({ 
        message: 'Kullanıcı bulunamadı.' 
      });
    }

    // Kullanıcıyı request'e ekle
    req.user = user;
    next();  // Sonraki middleware'e veya route'a geç

  } catch (error) {
    res.status(401).json({ 
      message: 'Geçersiz token. Lütfen tekrar giriş yapın.' 
    });
  }
};

module.exports = auth;