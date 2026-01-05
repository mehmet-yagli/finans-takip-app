const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
// --- YENİ: Kategori modelini import ettik (Bütçe kontrolü için) ---
const Category = require('../models/Category'); 
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
    
    // --- AKILLI ANALİZ: Bütçe Kontrolü (Sadece Giderler İçin) ---
    let alertData = null;

    if (type === 'expense') {
      // 1. İlgili kategoriyi bul ve bütçesi var mı bak
      const categoryDoc = await Category.findOne({ 
        user: req.user._id, 
        name: category 
      });

      if (categoryDoc && categoryDoc.budgetLimit > 0) {
        // 2. Bu ayın başlangıç ve bitiş tarihlerini bul
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 3. Bu kategoride bu ay yapılan toplam harcamayı hesapla
        const stats = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              category: category,
              type: 'expense',
              date: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' }
            }
          }
        ]);

        const currentTotal = stats.length > 0 ? stats[0].totalAmount : 0;
        const percentage = (currentTotal / categoryDoc.budgetLimit) * 100;

        // 4. Eğer %80'i geçtiyse uyarı oluştur
        if (percentage >= 80) {
          alertData = {
            category: category,
            limit: categoryDoc.budgetLimit,
            current: currentTotal,
            percentage: Math.round(percentage),
            message: `Dikkat! ${category} bütçenizin %${Math.round(percentage)}'ine ulaştınız.`
          };
        }
      }
    }

    // Cevabı hazırla (Transaction objesi + varsa Alert)
    const response = transaction.toObject();
    if (alertData) {
      response.budgetAlert = alertData;
    }
    
    res.status(201).json(response);
    
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

    // --- AKILLI ANALİZ: Bütçe Kontrolü (Update sonrası tekrar kontrol) ---
    // Not: İşlem güncellenince bütçe aşılmış olabilir
    let alertData = null;
    const currentType = type || transaction.type;
    const currentCategory = category || transaction.category;

    if (currentType === 'expense') {
      const categoryDoc = await Category.findOne({ 
        user: req.user._id, 
        name: currentCategory 
      });

      if (categoryDoc && categoryDoc.budgetLimit > 0) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const stats = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              category: currentCategory,
              type: 'expense',
              date: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' }
            }
          }
        ]);

        const currentTotal = stats.length > 0 ? stats[0].totalAmount : 0;
        const percentage = (currentTotal / categoryDoc.budgetLimit) * 100;

        if (percentage >= 80) {
          alertData = {
            category: currentCategory,
            limit: categoryDoc.budgetLimit,
            current: currentTotal,
            percentage: Math.round(percentage),
            message: `Dikkat! ${currentCategory} bütçenizin %${Math.round(percentage)}'ine ulaştınız.`
          };
        }
      }
    }
    
    // Cevabı hazırla
    const response = transaction.toObject();
    if (alertData) {
      response.budgetAlert = alertData;
    }

    res.json(response); 
    
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

// @route   GET /api/transactions/analytics/history
// @desc    Son 6 ayın Gelir/Gider analizini getirir (Grafikler için)
// @access  Private
router.get('/analytics/history', auth, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Son 6 ay (Bu ay dahil)
    sixMonthsAgo.setDate(1); // Ayın başına git

    const stats = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type"
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Veriyi Frontend'in kolay okuyacağı formata çevirelim
    // Örn: [{ month: "Ocak", income: 5000, expense: 2000 }, ...]
    const formattedStats = [];
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    stats.forEach(item => {
      const label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      let entry = formattedStats.find(e => e.label === label);

      if (!entry) {
        entry = { label, income: 0, expense: 0, year: item._id.year, month: item._id.month };
        formattedStats.push(entry);
      }

      if (item._id.type === 'income') entry.income = item.total;
      if (item._id.type === 'expense') entry.expense = item.total;
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('Analytics History Error:', error.message);
    res.status(500).json({ message: 'Analiz verisi oluşturulamadı' });
  }
});

// module.exports = router;  <-- BU SATIR ZATEN SENDE EN ALTTA VAR, KODU BUNUN ÜSTÜNE YAPIŞTIR.

module.exports = router;