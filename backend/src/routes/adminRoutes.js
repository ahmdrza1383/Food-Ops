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

// @route   GET /api/admin/discounts
// @desc    دریافت لیست کدهای تخفیف
// @access  Private (Admin only)
router.get('/discounts', adminController.getDiscounts);

// @route   POST /api/admin/discounts
// @desc    ایجاد کد تخفیف جدید
// @access  Private (Admin only)
router.post('/discounts', adminController.createDiscount);

// @route   DELETE /api/admin/discounts/:id
// @desc    حذف کد تخفیف
// @access  Private (Admin only)
router.delete('/discounts/:id', adminController.deleteDiscount);

// @route   PATCH /api/admin/discounts/:id/status
// @desc    تغییر وضعیت کد تخفیف
// @access  Private (Admin only)
router.patch('/discounts/:id/status', adminController.toggleDiscountStatus);

module.exports = router;