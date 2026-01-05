// backend/routes/subscriptions.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');

// @route   GET /api/subscriptions
// @desc    Kullanıcının tüm aboneliklerini getir
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Debug: İsteğin geldiğini görelim
    console.log('GET /api/subscriptions isteği alındı. Kullanıcı ID:', req.user.id);
    
    const subs = await Subscription.find({ user: req.user.id }).sort({ paymentDay: 1 });
    res.json(subs);
  } catch (err) {
    console.error('GET Hatası:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/subscriptions
// @desc    Yeni abonelik ekle
// @access  Private
router.post('/', auth, async (req, res) => {
  // Debug: Frontend'den gelen veriyi terminale yazdıralım
  console.log('POST /api/subscriptions Gelen Veri:', req.body);

  const { name, price, currency, paymentDay, category } = req.body;

  // Güvenlik: Zorunlu alan kontrolü ekliyoruz (mevcut kodunu bozmadan)
  if (!name || !price || !paymentDay) {
    console.error('Eksik veri gönderildi.');
    return res.status(400).json({ msg: 'Lütfen isim, fiyat ve ödeme gününü giriniz.' });
  }

  try {
    const newSub = new Subscription({
      user: req.user.id,
      name,
      price,
      currency,
      paymentDay,
      category: category || 'Other' // Kategori boş gelirse varsayılan atayalım
    });

    const savedSub = await newSub.save();
    console.log('Abonelik veritabanına kaydedildi:', savedSub);
    res.json(savedSub);
  } catch (err) {
    console.error('POST Kayıt Hatası:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/subscriptions/:id
// @desc    Abonelik sil
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let sub = await Subscription.findById(req.params.id);

    if (!sub) return res.status(404).json({ msg: 'Subscription not found' });

    // Kullanıcı kontrolü
    if (sub.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Subscription removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;