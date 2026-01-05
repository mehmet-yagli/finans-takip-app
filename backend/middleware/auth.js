const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Yetkisiz erişim.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;

    // 1. Deneme: Kullanıcıyı ara
    let user = await User.findById(userId).select('-password');

    // Eğer ilk seferde bulamazsa (Atlas senkronizasyon gecikmesi ihtimali)
    if (!user) {
      console.warn(`ID (${userId}) ilk denemede bulunamadı, tekrar deneniyor...`);
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms bekle
      user = await User.findById(userId).select('-password'); // 2. Deneme
    }

    if (!user) {
      console.error(`Kritik: ID (${userId}) Atlas'ta gerçekten yok!`);
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }

    req.user = user;
    next();
  } catch (error) {
    // "jwt malformed" hatasını burada daha net yakalıyoruz
    console.error("Auth Hatası:", error.message);
    res.status(401).json({ message: 'Oturum geçersiz, lütfen tekrar giriş yapın.' });
  }
};

module.exports = auth;