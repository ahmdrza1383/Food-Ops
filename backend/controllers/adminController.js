const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Role = require('../models/Role');
const mongoose = require('mongoose');

// @desc    دریافت لیست همه سفارش‌ها با امکان فیلتر و صفحه‌بندی
// @route   GET /api/admin/orders
// @access  Private (Admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;

        // ساختن query بر اساس فیلترها
        const query = {};

        if (status && ['registered', 'preparing', 'ready_for_delivery', 'delivered', 'canceled'].includes(status)) {
            query.status = status;
        }

        // محاسبه pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // دریافت سفارش‌ها با paginate و populate
        const orders = await Order.find(query)
            .populate('customer_id', 'fullname phone_number')
            .populate('items.menu_item_id', 'name price')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // شمارش کل سفارش‌ها برای pagination
        const total = await Order.countDocuments(query);

        res.status(200).json({
            status: 'success',
            message: 'لیست سفارش‌ها با موفقیت دریافت شد.',
            data: {
                orders,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / parseInt(limit)),
                    total_orders: total,
                    per_page: parseInt(limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در دریافت لیست سفارش‌ها.',
            error: error.message
        });
    }
};

// @desc    دریافت گزارش روزانه فروش
// @route   GET /api/admin/reports/daily
// @access  Private (Admin only)
exports.getDailyReport = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const numDays = parseInt(days);

        // محاسبه تاریخ شروع (days روز قبل از امروز)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);
        startDate.setHours(0, 0, 0, 0);

        // دریافت سفارش‌های تحویل داده شده در بازه زمانی مشخص
        const orders = await Order.find({
            status: 'delivered',
            createdAt: { $gte: startDate }
        })
        .select('final_price createdAt')
        .sort('createdAt');

        // گروه‌بندی سفارش‌ها بر اساس روز
        const dailyData = {};

        // مقداردهی اولیه برای تمام روزها
        for (let i = 0; i < numDays; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailyData[dateKey] = {
                date: dateKey,
                total_sales: 0,
                order_count: 0,
                orders: []
            };
        }

        // پر کردن داده‌ها
        orders.forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            if (dailyData[dateKey]) {
                dailyData[dateKey].total_sales += order.final_price;
                dailyData[dateKey].order_count += 1;
                dailyData[dateKey].orders.push({
                    order_id: order._id,
                    final_price: order.final_price,
                    created_at: order.createdAt
                });
            }
        });

        // تبدیل به آرایه و مرتب‌سازی بر اساس تاریخ
        const reportData = Object.values(dailyData).sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        // محاسبه مجموع کل
        const grandTotal = reportData.reduce((sum, day) => sum + day.total_sales, 0);
        const totalOrders = reportData.reduce((sum, day) => sum + day.order_count, 0);

        res.status(200).json({
            status: 'success',
            message: 'گزارش روزانه با موفقیت دریافت شد.',
            data: {
                period: {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0],
                    days: numDays
                },
                summary: {
                    total_revenue: grandTotal,
                    total_orders: totalOrders,
                    average_daily_revenue: grandTotal / numDays,
                    average_order_value: totalOrders > 0 ? grandTotal / totalOrders : 0
                },
                daily_reports: reportData
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در دریافت گزارش روزانه.',
            error: error.message
        });
    }
};

// @desc    دریافت گزارش پرفروش‌ترین آیتم‌های منو
// @route   GET /api/admin/reports/items
// @access  Private (Admin only)
exports.getItemsReport = async (req, res) => {
    try {
        const { limit = 10, days = 30 } = req.query;
        const numLimit = parseInt(limit);
        const numDays = parseInt(days);

        // محاسبه تاریخ شروع
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);
        startDate.setHours(0, 0, 0, 0);

        // دریافت سفارش‌های تحویل داده شده در بازه زمانی
        const orders = await Order.find({
            status: 'delivered',
            createdAt: { $gte: startDate }
        })
        .populate('items.menu_item_id', 'name price category_id')
        .select('items');

        // محاسبه فروش هر آیتم
        const itemStats = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                const menuItem = item.menu_item_id;
                if (!menuItem) return;

                const itemId = menuItem._id.toString();

                if (!itemStats[itemId]) {
                    itemStats[itemId] = {
                        menu_item_id: itemId,
                        name: menuItem.name,
                        category_id: menuItem.category_id,
                        total_quantity_sold: 0,
                        total_revenue: 0,
                        order_count: 0
                    };
                }

                itemStats[itemId].total_quantity_sold += item.quantity;
                itemStats[itemId].total_revenue += (item.unit_price * item.quantity);
                itemStats[itemId].order_count += 1;
            });
        });

        // تبدیل به آرایه و مرتب‌سازی بر اساس تعداد فروش
        let reportData = Object.values(itemStats)
            .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
            .slice(0, numLimit);

        // اضافه کردن اطلاعات دسته‌بندی اگر وجود دارد
        if (reportData.length > 0) {
            const Category = require('../models/Category');
            const categoryIds = [...new Set(reportData.map(item => item.category_id))];
            const categories = await Category.find({ _id: { $in: categoryIds } });

            const categoryMap = {};
            categories.forEach(cat => {
                categoryMap[cat._id.toString()] = cat.name;
            });

            reportData = reportData.map(item => ({
                ...item.toObject(),
                category_name: categoryMap[item.category_id?.toString()] || 'نامشخص'
            }));
        }

        // محاسبه مجموع کل
        const totalItemsSold = reportData.reduce((sum, item) => sum + item.total_quantity_sold, 0);
        const totalRevenue = reportData.reduce((sum, item) => sum + item.total_revenue, 0);

        res.status(200).json({
            status: 'success',
            message: 'گزارش آیتم‌های منو با موفقیت دریافت شد.',
            data: {
                period: {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0],
                    days: numDays
                },
                summary: {
                    total_items_sold: totalItemsSold,
                    total_revenue: totalRevenue,
                    items_count: reportData.length
                },
                top_items: reportData
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در دریافت گزارش آیتم‌های منو.',
            error: error.message
        });
    }
};

// @desc    تغییر نقش کاربر
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role_id } = req.body;

        // بررسی اعتبار ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه کاربر معتبر نیست.'
            });
        }

        // بررسی ارسال role_id
        if (!role_id || !mongoose.Types.ObjectId.isValid(role_id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه نقش معتبر نیست.'
            });
        }

        // بررسی وجود نقش
        const role = await Role.findById(role_id);
        if (!role) {
            return res.status(404).json({
                status: 'fail',
                message: 'نقش مورد نظر یافت نشد.'
            });
        }

        // پیدا کردن کاربر
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'کاربر مورد نظر یافت نشد.'
            });
        }

        // ذخیره نقش قبلی برای لاگ
        const oldRoleId = user.role_id;
        const oldRole = await Role.findById(oldRoleId);

        // تغییر نقش کاربر
        user.role_id = role_id;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: `نقش کاربر "${user.fullname}" با موفقیت از "${oldRole?.name || 'نامشخص'}" به "${role.name}" تغییر یافت.`,
            data: {
                user: {
                    id: user._id,
                    fullname: user.fullname,
                    phone_number: user.phone_number,
                    old_role: oldRole?.name || 'نامشخص',
                    new_role: role.name
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در تغییر نقش کاربر.',
            error: error.message
        });
    }
};