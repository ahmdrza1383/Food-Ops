const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, kitchenStaffOrAdmin, customerOnly, cashierOrAdmin } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', customerOnly, orderController.createOrder);
router.get('/me', customerOnly, orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', customerOnly, orderController.cancelOrder);
router.patch('/:id/start', kitchenStaffOrAdmin, orderController.startOrder);
router.patch('/:id/ready', kitchenStaffOrAdmin, orderController.readyOrder);
router.patch('/:id/deliver', cashierOrAdmin, orderController.deliverOrder);

module.exports = router;