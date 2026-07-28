const Order = require('../models/Order');

// @desc    دریافت سفارش‌های موجود در صف آشپزخانه
// @route   GET /api/kitchen/orders
// @access  Private (Kitchen Staff / Admin)
exports.getKitchenOrders = async (req, res) => {
    try {
        // دریافت سفارش‌هایی که ثبت شده‌اند یا در حال آماده‌سازی هستند (به ترتیب قدیمی‌ترین به جدیدترین)
        const orders = await Order.find({
            status: { $in: ['registered', 'preparing'] }
        })
            .populate('customer_id', 'fullname phone_number')
            .populate('items.menu_item_id', 'name price estimated_prep_time')
            .sort({ createdAt: 1 }); // ترتیب صعودی (FIFO - ورودی اول، خروجی اول)

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
            message: 'خطا در دریافت لیست سفارش‌های آشپزخانه.',
            error: error.message
        });
    }
};