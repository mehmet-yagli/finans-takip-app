const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Tüm route'lar auth middleware ile korumalı (token gerekli)

// @route   GET /api/transactions
// @desc    Kullanıcının tüm işlemlerini getir
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Kullanıcının işlemlerini getir, en yeni en üstte
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 });  // Tarihe göre azalan sıralama
    
    // --- DÜZELTME BURADA YAPILDI ---
    // Eski hali: res.json({ count: ..., transactions: ... });
    // Yeni hali: Direkt listeyi gönderiyoruz. Frontend bunu bekliyor.
    res.json(transactions);
    
  } catch (error) {
    console.error('Get transactions hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/transactions/:id
// @desc    Belirli bir işlemi getir
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    // İşlem bulunamadı
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    // İşlem bu kullanıcıya ait mi kontrol et
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işleme erişim yetkiniz yok' });
    }
    
    res.json(transaction);
    
  } catch (error) {
    console.error('Get transaction hatası:', error.message);
    
    // Geçersiz ID formatı
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/transactions
// @desc    Yeni işlem ekle
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;
    
    // Validasyon - zorunlu alanlar
    if (!type || !category || !amount) {
      return res.status(400).json({ 
        message: 'İşlem tipi, kategori ve tutar zorunludur' 
      });
    }
    
    // Type kontrolü
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ 
        message: 'İşlem tipi sadece "income" veya "expense" olabilir' 
      });
    }
    
    // Tutar kontrolü
    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Tutar 0\'dan büyük olmalıdır' 
      });
    }
    
    // Yeni işlem oluştur
    const transaction = new Transaction({
      user: req.user._id,
      type,
      category,
      amount,
      description: description || '',
      date: date || Date.now()
    });
    
    await transaction.save();
    
    // --- GÜNCELLEME ---
    // Tutarlılık olması için burada da direkt objeyi dönüyoruz
    res.status(201).json(transaction);
    
  } catch (error) {
    console.error('Create transaction hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/transactions/:id
// @desc    İşlem güncelle
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);
    
    // İşlem bulunamadı
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    // İşlem bu kullanıcıya ait mi kontrol et
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlemi güncelleme yetkiniz yok' });
    }
    
    const { type, category, amount, description, date } = req.body;
    
    // Güncellenecek alanlar
    const updateFields = {};
    if (type) {
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ 
          message: 'İşlem tipi sadece "income" veya "expense" olabilir' 
        });
      }
      updateFields.type = type;
    }
    if (category) updateFields.category = category;
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ 
          message: 'Tutar 0\'dan büyük olmalıdır' 
        });
      }
      updateFields.amount = amount;
    }
    if (description !== undefined) updateFields.description = description;
    if (date) updateFields.date = date;
    
    // Güncelle
    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }  // Güncellenmiş veriyi döndür
    );
    
    res.json(transaction); // Direkt objeyi döndürdük
    
  } catch (error) {
    console.error('Update transaction hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    İşlem sil
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    // İşlem bulunamadı
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    // İşlem bu kullanıcıya ait mi kontrol et
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlemi silme yetkiniz yok' });
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'İşlem başarıyla silindi' });
    
  } catch (error) {
    console.error('Delete transaction hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/transactions/summary/monthly
// @desc    Aylık özet (toplam gelir, gider, bakiye)
// @access  Private
router.get('/summary/monthly', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Eğer yıl ve ay belirtilmemişse şu anki ay
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    // Ayın başlangıç ve bitiş tarihleri
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Bu aydaki tüm işlemler
    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Gelir ve gider hesapla
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });
    
    const balance = totalIncome - totalExpense;
    
    res.json({
      year: targetYear,
      month: targetMonth,
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length
    });
    
  } catch (error) {
    console.error('Monthly summary hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/transactions/summary/category
// @desc    Kategoriye göre özet
// @access  Private
router.get('/summary/category', auth, async (req, res) => {
  try {
    const { type } = req.query;  // income veya expense
    
    // Type kontrolü
    if (type && type !== 'income' && type !== 'expense') {
      return res.status(400).json({ 
        message: 'Type parametresi "income" veya "expense" olmalıdır' 
      });
    }
    
    // Aggregate pipeline
    const matchStage = { user: req.user._id };
    if (type) {
      matchStage.type = type;
    }
    
    const categoryStats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    res.json({
      type: type || 'all',
      categories: categoryStats
    });
    
  } catch (error) {
    console.error('Category summary hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;