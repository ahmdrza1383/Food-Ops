const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Discount = require('../models/Discount');
const OrderLog = require('../models/OrderLog');
const Role = require('../models/Role');
const DailyCounter = require('../models/DailyCounter');
const mongoose = require('mongoose');

// @desc    ثبت سفارش جدید توسط مشتری
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = async (req, res) => {
    try {
        const { items, discount_code } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'سبد خرید نمی‌تواند خالی باشد.'
            });
        }

        let totalPrice = 0;
        const orderItems = [];
        const itemsToUpdateStock = [];

        // ۱. بررسی آیتم‌ها، موجودی انبار و محاسبه قیمت
        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menu_item_id);

            if (!menuItem) {
                return res.status(404).json({
                    status: 'fail',
                    message: `آیتم با شناسه ${item.menu_item_id} یافت نشد.`
                });
            }

            if (!menuItem.status || menuItem.stock_quantity < item.quantity) {
                return res.status(400).json({
                    status: 'fail',
                    message: `موجودی آیتم "${menuItem.name}" کافی نیست یا غیرفعال است.`
                });
            }

            const itemTotalPrice = menuItem.price * item.quantity;
            totalPrice += itemTotalPrice;

            orderItems.push({
                menu_item_id: menuItem._id,
                quantity: item.quantity,
                unit_price: menuItem.price
            });

            itemsToUpdateStock.push({
                menuItem,
                quantity: item.quantity
            });
        }

        let finalPrice = totalPrice;
        let discountCodeId = null;

        // ۲. بررسی و اعمال کد تخفیف در صورت ارسال
        if (discount_code) {
            const discount = await Discount.findOne({
                code: discount_code,
                is_active: true
            });

            if (!discount) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'کد تخفیف وارد شده معتبر نیست.'
                });
            }

            if (new Date(discount.expiration_date) < new Date()) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'کد تخفیف منقضی شده است.'
                });
            }

            discountCodeId = discount._id;
            const discountAmount = (totalPrice * discount.discount_percent) / 100;
            finalPrice = totalPrice - discountAmount;
        }

        // ۳. تولید شماره سفارش روزانه (YYYY-MM-DD) به صورت اتمیک و امن
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        const counter = await DailyCounter.findOneAndUpdate(
            { date: dateStr },
            { $inc: { seq: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // ۴. کسر موجودی از انبار
        for (const item of itemsToUpdateStock) {
            item.menuItem.stock_quantity -= item.quantity;
            await item.menuItem.save();
        }

        // ۵. ایجاد سفارش در دیتابیس همراه با شماره روزانه
        const newOrder = await Order.create({
            customer_id: req.user._id,
            items: orderItems,
            total_price: totalPrice,
            discount_code_id: discountCodeId,
            final_price: finalPrice,
            status: 'registered',
            daily_order_number: counter.seq // 👈 تخصیص شماره سفارش روزانه
        });

        // ۶. ثبت لاگ ایجاد سفارش
        await OrderLog.create({
            order_id: newOrder._id,
            old_status: null,
            new_status: 'registered',
            changed_by: req.user._id,
            action_type: 'ORDER_CREATED'
        });

        res.status(201).json({
            status: 'success',
            message: 'سفارش با موفقیت ثبت شد.',
            data: {
                order: newOrder
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در ثبت سفارش.',
            error: error.message
        });
    }
};

// @desc    دریافت لیست سفارش‌های کاربر فعلی
// @route   GET /api/orders/me
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer_id: req.user._id })
            .populate('items.menu_item_id', 'name price image_url')
            .sort({ createdAt: -1 });

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
            message: 'خطا در دریافت سفارش‌ها.',
            error: error.message
        });
    }
};

// @desc    دریافت جزئیات یک سفارش
// @route   GET /api/orders/:id
// @access  Private (Owner Customer or Staff/Admin)
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه سفارش معتبر نیست.'
            });
        }

        const order = await Order.findById(id)
            .populate('items.menu_item_id', 'name price image_url')
            .populate('customer_id', 'fullname phone_number');

        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'سفارشی با این شناسه یافت نشد.'
            });
        }

        // ۱. دریافت نقش کاربر لاگین‌شده از روی role_id
        const userRole = await Role.findById(req.user.role_id);
        const roleName = userRole ? userRole.name : '';

        const isStaff = ['Admin', 'admin', 'Kitchen Staff', 'Cashier'].includes(roleName);
        const isOwner = order.customer_id._id.toString() === req.user._id.toString();

        if (!isStaff && !isOwner) {
            return res.status(403).json({
                status: 'fail',
                message: 'شما اجازه دسترسی و مشاهده این سفارش را ندارید.'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در دریافت جزئیات سفارش.',
            error: error.message
        });
    }
};

// @desc    لغو سفارش توسط مشتری
// @route   PATCH /api/orders/:id/cancel
// @access  Private (Customer)
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه سفارش معتبر نیست.'
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'سفارشی با این شناسه یافت نشد.'
            });
        }

        // بررسی مالکیت سفارش
        if (order.customer_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'fail',
                message: 'شما اجازه لغو این سفارش را ندارید.'
            });
        }

        // بررسی امکان لغو (فقط در مرحله 'registered' مجاز است)
        if (order.status !== 'registered') {
            return res.status(400).json({
                status: 'fail',
                message: 'سفارش وارد مرحله آماده‌سازی شده و امکان لغو آن وجود ندارد.'
            });
        }

        const oldStatus = order.status;
        order.status = 'canceled';
        await order.save();

        // بازگرداندن موجودی کالاها به انبار
        for (const item of order.items) {
            await MenuItem.findByIdAndUpdate(item.menu_item_id, {
                $inc: { stock_quantity: item.quantity }
            });
        }

        // ثبت لاگ لغو سفارش
        await OrderLog.create({
            order_id: order._id,
            old_status: oldStatus,
            new_status: 'canceled',
            changed_by: req.user._id,
            action_type: 'ORDER_CANCELED'
        });

        res.status(200).json({
            status: 'success',
            message: 'سفارش با موفقیت لغو شد.',
            data: {
                order
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در لغو سفارش.',
            error: error.message
        });
    }
};

// @desc    تغییر وضعیت سفارش به در حال آماده‌سازی
// @route   PATCH /api/orders/:id/start
// @access  Private (Kitchen Staff / Admin)
exports.startOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه سفارش معتبر نیست.'
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'سفارشی با این شناسه یافت نشد.'
            });
        }

        if (order.status !== 'registered') {
            return res.status(400).json({
                status: 'fail',
                message: `سفارش در وضعیت "${order.status}" قرار دارد و قابل شروع نیست.`
            });
        }

        const oldStatus = order.status;
        order.status = 'preparing';
        await order.save();

        // ثبت لاگ تغییر وضعیت
        await OrderLog.create({
            order_id: order._id,
            old_status: oldStatus,
            new_status: 'preparing',
            changed_by: req.user._id,
            action_type: 'STATUS_UPDATED'
        });

        res.status(200).json({
            status: 'success',
            message: 'آماده‌سازی سفارش آغاز شد.',
            data: {
                order
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در تغییر وضعیت سفارش.',
            error: error.message
        });
    }
};

// @desc    تغییر وضعیت سفارش به آماده تحویل
// @route   PATCH /api/orders/:id/ready
// @access  Private (Kitchen Staff / Admin)
exports.readyOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه سفارش معتبر نیست.'
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'سفارشی با این شناسه یافت نشد.'
            });
        }

        if (order.status !== 'preparing') {
            return res.status(400).json({
                status: 'fail',
                message: `امکان تغییر وضعیت سفارش از "${order.status}" به آماده تحویل وجود ندارد.`
            });
        }

        const oldStatus = order.status;
        order.status = 'ready_for_delivery';
        await order.save();

        // ثبت لاگ تغییر وضعیت
        await OrderLog.create({
            order_id: order._id,
            old_status: oldStatus,
            new_status: 'ready_for_delivery',
            changed_by: req.user._id,
            action_type: 'STATUS_UPDATED'
        });

        res.status(200).json({
            status: 'success',
            message: 'سفارش با موفقیت آماده تحویل شد.',
            data: {
                order
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در تغییر وضعیت سفارش.',
            error: error.message
        });
    }
};

// @desc    ثبت تحویل سفارش به مشتری
// @route   PATCH /api/orders/:id/deliver
// @access  Private (Cashier / Admin)
exports.deliverOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'شناسه سفارش معتبر نیست.'
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'سفارشی با این شناسه یافت نشد.'
            });
        }

        if (order.status !== 'ready_for_delivery') {
            return res.status(400).json({
                status: 'fail',
                message: `سفارش در وضعیت "${order.status}" قرار دارد و آماده تحویل نیست.`
            });
        }

        const oldStatus = order.status;
        order.status = 'delivered';
        await order.save();

        // ثبت لاگ تحویل سفارش
        await OrderLog.create({
            order_id: order._id,
            old_status: oldStatus,
            new_status: 'delivered',
            changed_by: req.user._id,
            action_type: 'ORDER_DELIVERED'
        });

        res.status(200).json({
            status: 'success',
            message: 'سفارش با موفقیت تحویل داده شد.',
            data: {
                order
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در ثبت تحویل سفارش.',
            error: error.message
        });
    }
};

// @desc    بررسی و اعتبارسنجی کد تخفیف پیش از ثبت سفارش
// @route   POST /api/orders/validate-discount
// @access  Private (Customer)
exports.validateDiscount = async (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ status: 'fail', message: 'لطفاً کد تخفیف را وارد کنید.' });
        }

        // جستجوی کد تخفیف فعال در دیتابیس
        const discount = await Discount.findOne({
            code: code.toUpperCase(),
            is_active: true
        });

        if (!discount) {
            return res.status(404).json({
                status: 'fail',
                message: 'کد تخفیف وارد شده نامعتبر است یا غیرفعال شده است.'
            });
        }

        // بررسی تاریخ انقضا
        if (new Date(discount.expiration_date) < new Date()) {
            return res.status(400).json({
                status: 'fail',
                message: 'متأسفانه این کد تخفیف منقضی شده است.'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'کد تخفیف معتبر است.',
            data: {
                code: discount.code,
                discount_percent: discount.discount_percent
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطا در بررسی کد تخفیف.',
            error: error.message
        });
    }
};

exports.getKioskOrders = async (req, res) => {
  try {
    // ۱. تنظیم زمان شروع و پایان امروز برای فیلتر کردن دیتابیس
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // ۲. دریافت سفارش‌های در حال آماده‌سازیِ امروز
    // استفاده از createdAt تضمین می‌کند که فقط سفارش‌های ثبت‌شده در امروز دریافت شوند
    const preparing_orders = await Order.find({
      status: 'preparing',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('daily_order_number status updatedAt'); 
    // متد select باعث می‌شود دیتای اضافی از دیتابیس کشیده نشود و سرعت بالا برود

    // ۳. دریافت سفارش‌های آماده تحویلِ امروز
    const ready_orders = await Order.find({
      status: 'ready_for_delivery',
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('daily_order_number status updatedAt');

    // ۴. ارسال پاسخ موفق به همراه دو آرایه جداگانه
    res.status(200).json({
      status: 'success',
      data: {
        preparing_orders,
        ready_orders
      }
    });

  } catch (error) {
    console.error('❌ خطا در دریافت اطلاعات کیوسک:', error);
    res.status(500).json({
      status: 'error',
      message: 'خطای سرور در دریافت لیست سفارش‌های کیوسک'
    });
  }
};