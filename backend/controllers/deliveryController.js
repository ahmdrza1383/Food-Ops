const Order = require('../models/Order');

// @desc    دریافت لیست سفارش‌های آماده تحویل
// @route   GET /api/delivery/orders
// @access  Private (Cashier / Admin)
exports.getReadyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'ready_for_delivery' })
            .populate('customer_id', 'fullname phone_number')
            .populate('items.menu_item_id', 'name price')
            .sort({ updatedAt: 1 }); // ترتیب براساس زمان آماده‌سازی (قدیمی‌ترها اول)

        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: {
                orders
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در دریافت لیست سفارش‌های آماده تحویل.',
            error: error.message
        });
    }
};