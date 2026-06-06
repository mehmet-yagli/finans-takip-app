const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Kullanıcı şeması (schema) - veritabanında nasıl saklanacak?
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'İsim zorunludur'],
    trim: true 
  },
  email: {
    type: String,
    required: [true, 'Email zorunludur'],
    unique: true,  
    lowercase: true, 
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Şifre zorunludur'],
    minlength: [6, 'Şifre en az 6 karakter olmalı']
  }
}, {
  timestamps: true  // createdAt ve updatedAt otomatik eklenir
});

// Şifre kaydetmeden önce hash'le (şifrele)
userSchema.pre('save', async function(next) {
  // Eğer şifre değişmediyse hash'leme
  if (!this.isModified('password')) {
    return next();
  }
  
  // Şifreyi hash'le
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifre doğrulama metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);