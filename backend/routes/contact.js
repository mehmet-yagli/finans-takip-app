const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

// @route   POST /api/contact
// @desc    Kullanıcıdan gelen mesajı kaydet
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ msg: 'Lütfen konu ve mesaj alanlarını doldurun.' });
    }

    const newMessage = new Message({
      user: req.user.id,
      subject,
      message
    });

    await newMessage.save();

    res.json({ msg: 'Mesajınız başarıyla alındı. En kısa sürede döneceğiz!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;