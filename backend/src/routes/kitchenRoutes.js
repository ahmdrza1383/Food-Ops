const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const { protect, kitchenStaffOrAdmin } = require('../middlewares/authMiddleware');

router.get('/orders', protect, kitchenStaffOrAdmin, kitchenController.getKitchenOrders);

module.exports = router;