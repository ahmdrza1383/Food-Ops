const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const sanitize = require('./middlewares/sanitize'); 
const categoryRoutes = require('./routes/categoryRoutes');
const menuItemRoutes = require('./routes/menuItemRoutes');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(sanitize);

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const MONGO_URI = 'mongodb://admin:password@localhost:27017/foodops?authSource=admin';

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

app.listen(PORT, () => {
  console.log('----------------------------------------------------');
  console.log(`Server is running and listening on port ${PORT}`);
  console.log(`Test it in browser: http://localhost:${PORT}`);
  console.log('----------------------------------------------------');
});