const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Bağlantı seçeneklerine yazma onayını (w: majority) ekliyoruz
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority'
    });
    console.log('MongoDB bağlantısı başarılı! ✅');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;