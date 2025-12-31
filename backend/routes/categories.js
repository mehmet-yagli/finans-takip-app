const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Tüm route'lar auth middleware ile korumalı

// @route   GET /api/categories
// @desc    Kullanıcının tüm kategorilerini getir
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;  // income veya expense filtresi
    
    // Filtre oluştur
    const filter = { user: req.user._id };
    if (type) {
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ 
          message: 'Type parametresi "income" veya "expense" olmalıdır' 
        });
      }
      filter.type = type;
    }
    
    // Kategorileri getir
    const categories = await Category.find(filter).sort({ name: 1 });
    
    res.json({
      count: categories.length,
      categories
    });
    
  } catch (error) {
    console.error('Get categories hatası:', error.message);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/categories/:id
// @desc    Belirli bir kategoriyi getir
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    // Kategori bulunamadı
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    // Kategori bu kullanıcıya ait mi kontrol et
    if (category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu kategoriye erişim yetkiniz yok' });
    }
    
    res.json(category);
    
  } catch (error) {
    console.error('Get category hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/categories
// @desc    Yeni kategori ekle
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    
    // Validasyon
    if (!name || !type) {
      return res.status(400).json({ 
        message: 'Kategori adı ve tipi zorunludur' 
      });
    }
    
    // Type kontrolü
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ 
        message: 'Kategori tipi sadece "income" veya "expense" olabilir' 
      });
    }
    
    // Aynı isimde kategori var mı kontrol et
    const existingCategory = await Category.findOne({
      user: req.user._id,
      name: name.trim(),
      type
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Bu isimde ve tipte bir kategori zaten mevcut' 
      });
    }
    
    // Yeni kategori oluştur
    const category = new Category({
      user: req.user._id,
      name: name.trim(),
      type,
      icon: icon || '📁',
      color: color || '#3B82F6'
    });
    
    await category.save();
    
    res.status(201).json({
      message: 'Kategori başarıyla eklendi',
      category
    });
    
  } catch (error) {
    console.error('Create category hatası:', error.message);
    
    // Unique index hatası (aynı isim, tip ve user)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu isimde ve tipte bir kategori zaten mevcut' 
      });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Kategori güncelle
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);
    
    // Kategori bulunamadı
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    // Kategori bu kullanıcıya ait mi kontrol et
    if (category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu kategoriyi güncelleme yetkiniz yok' });
    }
    
    const { name, type, icon, color } = req.body;
    
    // Güncellenecek alanlar
    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (type) {
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ 
          message: 'Kategori tipi sadece "income" veya "expense" olabilir' 
        });
      }
      updateFields.type = type;
    }
    if (icon) updateFields.icon = icon;
    if (color) updateFields.color = color;
    
    // İsim ve tip değişiyorsa duplicate kontrolü
    if (name || type) {
      const checkName = name || category.name;
      const checkType = type || category.type;
      
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },  // Kendisi hariç
        user: req.user._id,
        name: checkName.trim(),
        type: checkType
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          message: 'Bu isimde ve tipte bir kategori zaten mevcut' 
        });
      }
    }
    
    // Güncelle
    category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.json({
      message: 'Kategori başarıyla güncellendi',
      category
    });
    
  } catch (error) {
    console.error('Update category hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu isimde ve tipte bir kategori zaten mevcut' 
      });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Kategori sil
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    // Kategori bulunamadı
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    // Kategori bu kullanıcıya ait mi kontrol et
    if (category.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu kategoriyi silme yetkiniz yok' });
    }
    
    // Bu kategoriye ait işlem var mı kontrol et
    const Transaction = require('../models/Transaction');
    const transactionCount = await Transaction.countDocuments({
      user: req.user._id,
      category: category.name
    });
    
    if (transactionCount > 0) {
      return res.status(400).json({ 
        message: `Bu kategoriye ait ${transactionCount} işlem bulunmaktadır. Önce işlemleri silmeniz veya başka kategoriye taşımanız gerekiyor.` 
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Kategori başarıyla silindi' });
    
  } catch (error) {
    console.error('Delete category hatası:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;