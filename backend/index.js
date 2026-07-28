require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const sanitize = require('./middlewares/sanitize');
const categoryRoutes = require('./routes/categoryRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(sanitize);

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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

app.listen(PORT, () => {
  console.log('----------------------------------------------------');
  console.log(`Server is running and listening on port ${PORT}`);
  console.log(`Test it in browser: http://localhost:${PORT}`);
  console.log('----------------------------------------------------');
});