const express = require('express');
const mongoose = require('mongoose');

// ساخت وب‌سرور با اکسپرس
const app = express();
const PORT = 3000;

// میدلور برای خواندن و درک کردن دیتای JSON در درخواست‌ها
app.use(express.json());

// همان رشته اتصال طلایی که در مرحله قبل تست و تایید شد
const MONGO_URI = 'mongodb://admin:password@localhost:27017/foodops?authSource=admin';

// ۱. اتصال به دیتابیس مونگودی‌بی
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB (foodops database)!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// ۲. یک روت (Route) تستی ساده برای اینکه مطمئن شویم سرور جواب می‌دهد
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: '🚀 Food-Ops API Server is running successfully!' 
  });
});

// ۳. روشن کردن سرور و زنده نگه داشتن ترمینال
app.listen(PORT, () => {
  console.log('----------------------------------------------------');
  console.log(`🚀 Server is running and listening on port ${PORT}`);
  console.log(`🌐 Test it in browser: http://localhost:${PORT}`);
  console.log('----------------------------------------------------');
});