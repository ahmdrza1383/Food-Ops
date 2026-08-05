const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Role = require('../models/Role');
const Discount = require('../models/Discount'); 
const SystemSetting = require('../models/SystemSetting');

const mongoose = require('mongoose');

const VALID_SORT_FIELDS = ['createdAt', 'updatedAt', 'final_price', 'total_price', 'status'];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

// @desc    دریافت لیست همه سفارش‌ها با امکان فیلتر و صفحه‌بندی
// @route   GET /api/admin/orders
// @access  Private (Admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = DEFAULT_LIMIT, sort = '-createdAt' } = req.query;

        let parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
            parsedLimit = DEFAULT_LIMIT;
        }
        parsedLimit = Math.min(parsedLimit, MAX_LIMIT);

        let parsedPage = parseInt(page);
        if (isNaN(parsedPage) || parsedPage < 1) {
            parsedPage = 1;
        }

        const query = {};

        if (status && ['registered', 'preparing', 'ready_for_delivery', 'delivered', 'canceled'].includes(status)) {
            query.status = status;
        }

        let sortOption = {};
        const sortField = sort.replace(/^-/, '');
        const sortOrder = sort.startsWith('-') ? -1 : 1;

        if (VALID_SORT_FIELDS.includes(sortField)) {
            sortOption[sortField] = sortOrder;
        } else {
            sortOption = { createdAt: -1 };
        }

        const skip = (parsedPage - 1) * parsedLimit;

        const orders = await Order.find(query)
            .populate('customer_id', 'fullname phone_number role_id')
            .populate('items.menu_item_id', 'name price image_url status')
            .populate('discount_code_id', 'code discount_percent')
            .sort(sortOption)
            .skip(skip)
            .limit(parsedLimit);

        const total = await Order.countDocuments(query);

        res.status(200).json({
            status: 'success',
            message: 'لیست سفارش‌ها با موفقیت دریافت شد.',
            data: {
                orders,
                pagination: {
                    current_page: parsedPage,
                    total_pages: Math.ceil(total / parsedLimit),
                    total_orders: total,
                    per_page: parsedLimit,
                    has_next: parsedPage < Math.ceil(total / parsedLimit),
                    has_prev: parsedPage > 1
                }
            }
        });

    } catch (error) {
        console.error('Error in getAllOrders:', error);
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
        let numDays = parseInt(days);
        if (isNaN(numDays) || numDays < 1) numDays = 7;
        numDays = Math.min(numDays, 90);

        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - numDays);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(now);
        endDate.setUTCHours(23, 59, 59, 999);

        const summaryAggregation = await Order.aggregate([
            {
                $match: {
                    status: 'delivered',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total_revenue: { $sum: '$final_price' },
                    total_orders: { $sum: 1 }
                }
            }
        ]);

        const totalRevenue = summaryAggregation[0]?.total_revenue || 0;
        const totalOrders = summaryAggregation[0]?.total_orders || 0;

        const dailyStats = await Order.aggregate([
            {
                $match: {
                    status: 'delivered',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    total_sales: { $sum: '$final_price' },
                    order_count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        const dailyDataMap = {};
        for (let i = 0; i < numDays; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailyDataMap[dateKey] = {
                date: dateKey,
                total_sales: 0,
                order_count: 0
            };
        }

        dailyStats.forEach(stat => {
            if (dailyDataMap[stat._id]) {
                dailyDataMap[stat._id].total_sales = stat.total_sales;
                dailyDataMap[stat._id].order_count = stat.order_count;
            }
        });

        const reportData = Object.values(dailyDataMap).sort((a, b) => new Date(b.date) - new Date(a.date));

        const avgDailyRevenue = numDays > 0 ? (totalRevenue / numDays) : 0;
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

        const bestDay = dailyStats.length > 0 ? dailyStats.reduce((max, day) =>
            day.total_sales > max.total_sales ? day : max
        ) : null;

        res.status(200).json({
            status: 'success',
            message: 'گزارش روزانه با موفقیت دریافت شد.',
            data: {
                period: {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    days: numDays,
                    active_days: dailyStats.length
                },
                summary: {
                    total_revenue: Math.round(totalRevenue * 100) / 100,
                    total_orders: totalOrders, 
                    average_daily_revenue: Math.round(avgDailyRevenue * 100) / 100,
                    average_order_value: Math.round(avgOrderValue * 100) / 100,
                    best_day: bestDay ? {
                        date: bestDay._id,
                        total_sales: bestDay.total_sales,
                        order_count: bestDay.order_count
                    } : null
                },
                daily_reports: reportData
            }
        });

    } catch (error) {
        console.error('Error in getDailyReport:', error);
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
        let numLimit = parseInt(limit);
        let numDays = parseInt(days);

        if (isNaN(numLimit) || numLimit < 1) {
            numLimit = 10;
        }
        numLimit = Math.min(numLimit, 50);

        if (isNaN(numDays) || numDays < 1) {
            numDays = 30;
        }
        numDays = Math.min(numDays, 90);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - numDays);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const itemStats = await Order.aggregate([
            {
                $match: {
                    status: 'delivered',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: '$items.menu_item_id',
                    total_quantity_sold: { $sum: '$items.quantity' },
                    total_revenue: { $sum: { $multiply: ['$items.unit_price', '$items.quantity'] } },
                    order_count: { $sum: 1 },
                    avg_unit_price: { $avg: '$items.unit_price' }
                }
            },
            {
                $sort: { total_quantity_sold: -1 }
            },
            {
                $limit: numLimit
            },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'menu_item'
                }
            },
            {
                $unwind: {
                    path: '$menu_item',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'menu_item.category_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    menu_item_id: '$_id',
                    name: '$menu_item.name',
                    image_url: '$menu_item.image_url',
                    category_id: '$menu_item.category_id',
                    category_name: '$category.name',
                    total_quantity_sold: 1,
                    total_revenue: { $round: ['$total_revenue', 2] },
                    order_count: 1,
                    avg_unit_price: { $round: ['$avg_unit_price', 2] }
                }
            }
        ]);

        const totalItemsSold = itemStats.reduce((sum, item) => sum + item.total_quantity_sold, 0);
        const totalRevenue = itemStats.reduce((sum, item) => sum + item.total_revenue, 0);

        const topItem = itemStats.length > 0 ? itemStats[0] : null;

        res.status(200).json({
            status: 'success',
            message: 'گزارش آیتم‌های منو با موفقیت دریافت شد.',
            data: {
                period: {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    days: numDays
                },
                summary: {
                    total_items_sold: totalItemsSold,
                    total_revenue: Math.round(totalRevenue * 100) / 100,
                    items_count: itemStats.length,
                    top_item: topItem ? {
                        id: topItem.menu_item_id,
                        name: topItem.name,
                        quantity_sold: topItem.total_quantity_sold
                    } : null
                },
                top_items: itemStats
            }
        });

    } catch (error) {
        console.error('Error in getItemsReport:', error);
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه کاربر معتبر نیست.'
            });
        }

        if (!role_id || !mongoose.Types.ObjectId.isValid(role_id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه نقش معتبر نیست.'
            });
        }

        const role = await Role.findById(role_id);
        if (!role) {
            return res.status(404).json({
                status: 'fail',
                message: 'نقش مورد نظر یافت نشد.'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'کاربر مورد نظر یافت نشد.'
            });
        }

        const currentRole = await Role.findById(user.role_id);
        if (currentRole?.name?.toLowerCase() === 'admin' && role.name.toLowerCase() !== 'admin') {
            const otherAdmins = await User.find({
                role_id: { $in: (await Role.find({ name: 'admin' })).map(r => r._id) },
                _id: { $ne: id }
            });

            if (otherAdmins.length === 0) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'امکان حذف آخرین مدیر سیستم وجود ندارد.'
                });
            }
        }

        const oldRoleId = user.role_id;
        const oldRole = await Role.findById(oldRoleId);

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
                    email: user.email || null,
                    old_role: {
                        id: oldRoleId,
                        name: oldRole?.name || 'نامشخص'
                    },
                    new_role: {
                        id: role._id,
                        name: role.name
                    }
                },
                changed_at: new Date(),
                changed_by: req.user._id
            }
        });

    } catch (error) {
        console.error('Error in updateUserRole:', error);
        res.status(500).json({
            status: 'error',
            message: 'خطا در تغییر نقش کاربر.',
            error: error.message
        });
    }
};

// @desc    دریافت همه کدهای تخفیف
// @route   GET /api/admin/discounts
// @access  Private (Admin only)
exports.getDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.find().sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            data: { discounts }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'خطا در دریافت کدهای تخفیف.' });
    }
};

// @desc    ساخت کد تخفیف جدید
// @route   POST /api/admin/discounts
// @access  Private (Admin only)
exports.createDiscount = async (req, res) => {
    try {
        const { code, discount_percent, expiration_date, is_active } = req.body;

        const newDiscount = await Discount.create({
            code: code.toUpperCase(),
            discount_percent,
            expiration_date,
            is_active
        });

        res.status(201).json({
            status: 'success',
            data: { discount: newDiscount }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: 'error', message: 'این کد تخفیف قبلاً ثبت شده است.' });
        }
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    حذف کد تخفیف
// @route   DELETE /api/admin/discounts/:id
// @access  Private (Admin only)
exports.deleteDiscount = async (req, res) => {
    try {
        const discount = await Discount.findByIdAndDelete(req.params.id);
        
        if (!discount) {
            return res.status(404).json({ status: 'error', message: 'کد تخفیف یافت نشد.' });
        }

        res.status(200).json({ status: 'success', message: 'کد تخفیف با موفقیت حذف شد.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'خطا در حذف کد تخفیف.' });
    }
};

// @route   PATCH /api/admin/discounts/:id/status
// @desc    تغییر وضعیت کد تخفیف
// @access  Private (Admin only)
exports.toggleDiscountStatus = async (req, res) => {
    try {
        const { is_active } = req.body;
        
        const discount = await Discount.findByIdAndUpdate(
            req.params.id,
            { is_active },
            { new: true, runValidators: true }
        );

        if (!discount) {
            return res.status(404).json({ status: 'error', message: 'کد تخفیف یافت نشد.' });
        }

        res.status(200).json({ status: 'success', message: 'وضعیت با موفقیت تغییر کرد.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'خطا در تغییر وضعیت کد تخفیف.' });
    }
};

// @desc    به‌روزرسانی تنظیمات ساعت کاری و وضعیت پذیرش سفارش
// @route   PUT /api/admin/settings/working-hours
// @access  Private (Admin only)
exports.updateSystemSettings = async (req, res) => {
    try {
        const { opening_time, closing_time, is_accepting_orders } = req.body;

        let settings = await SystemSetting.findOne();

        if (!settings) {
            settings = new SystemSetting({});
        }

        if (opening_time !== undefined) settings.opening_time = opening_time;
        if (closing_time !== undefined) settings.closing_time = closing_time;
        if (is_accepting_orders !== undefined) settings.is_accepting_orders = is_accepting_orders;

        await settings.save();

        return res.status(200).json({
            status: 'success',
            message: 'تنظیمات ساعت کاری و سیستم با موفقیت به‌روزرسانی شد.',
            data: { settings }
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'خطا در به‌روزرسانی تنظیمات سیستم.',
            error: error.message
        });
    }
};


// @route   GET /api/admin/settings/working-hours
// @desc    دریافت تنظیمات ساعت کاری و وضعیت پذیرش سفارش
// @access  Private (Admin only)
exports.getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSetting.findOne(); 
        
        if (!settings) {
            settings = {
                opening_time: '',
                closing_time: '',
                is_accepting_orders: false
            };
        }

        res.status(200).json({
            status: 'success',
            data: settings
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};