const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

// تمامی روت‌های سفارش نیازمند احراز هویت هستند
router.use(protect);

router.post('/', orderController.createOrder);
router.get('/me', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;