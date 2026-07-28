const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, kitchenStaffOrAdmin, customerOnly } = require('../middlewares/authMiddleware');

// تمامی روت‌های سفارش نیازمند احراز هویت هستند
router.use(protect);

router.post('/', customerOnly, orderController.createOrder);
router.get('/me', customerOnly, orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', customerOnly, orderController.cancelOrder);
router.patch('/:id/start', kitchenStaffOrAdmin, orderController.startOrder);
router.patch('/:id/ready', kitchenStaffOrAdmin, orderController.readyOrder);

module.exports = router;