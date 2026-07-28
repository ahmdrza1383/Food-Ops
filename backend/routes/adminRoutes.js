const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(admin);

// @route   GET /api/admin/orders
// @desc    دریافت لیست همه سفارش‌ها با امکان فیلتر و صفحه‌بندی
// @access  Private (Admin only)
router.get('/orders', adminController.getAllOrders);

// @route   GET /api/admin/reports/daily
// @desc    دریافت گزارش روزانه فروش
// @access  Private (Admin only)
router.get('/reports/daily', adminController.getDailyReport);

// @route   GET /api/admin/reports/items
// @desc    دریافت گزارش پرفروش‌ترین آیتم‌های منو
// @access  Private (Admin only)
router.get('/reports/items', adminController.getItemsReport);

// @route   PATCH /api/admin/users/:id/role
// @desc    تغییر نقش کاربر
// @access  Private (Admin only)
router.patch('/users/:id/role', adminController.updateUserRole);

module.exports = router;