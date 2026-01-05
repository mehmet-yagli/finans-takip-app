require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
connectDB();

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Finans Takip API çalışıyor! 🚀' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));  
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/market', require('./routes/market'));
app.use('/api/contact', require('./routes/contact'));

// 👇 YENİ: AI Chatbot rotası sisteme tanıtıldı
app.use('/api/ai', require('./routes/ai'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor 🚀`);
});