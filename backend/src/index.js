require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const sanitize = require('./middlewares/sanitize');
const { errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminRoutes = require('./routes/adminRoutes');




const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 

app.use(express.json());

app.use(sanitize);

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));


const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB (foodops database)!');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Food-Ops API Server is running successfully!'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler - Route Not Found
app.use((req, res, next) => {
  const err = new Error(`مسیر ${req.originalUrl} یافت نشد.`);
  err.status = 404;
  next(err);
});

// Global Error Handler - Must be last middleware
app.use(errorHandler);


app.listen(PORT, () => {
  console.log('----------------------------------------------------');
  console.log(`Server is running and listening on port ${PORT}`);
  console.log(`Test it in browser: http://localhost:${PORT}`);
  console.log('----------------------------------------------------');
});