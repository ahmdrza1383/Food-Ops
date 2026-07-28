const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { protect, cashierOrAdmin } = require('../middlewares/authMiddleware');

router.get('/orders', protect, cashierOrAdmin, deliveryController.getReadyOrders);

module.exports = router;