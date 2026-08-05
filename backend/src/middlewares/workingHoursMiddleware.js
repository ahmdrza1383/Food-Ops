const SystemSetting = require('../models/SystemSetting');

const checkWorkingHours = async (req, res, next) => {
    try {
        // خواندن تنظیمات سیستم (معمولاً اولین رکورد تنظیمات است)
        let settings = await SystemSetting.findOne();
        
        // اگر تنظیماتی هنوز وجود نداشت، مقادیر پیش‌فرض را در نظر می‌گیریم
        if (!settings) {
            settings = {
                opening_time: "08:00",
                closing_time: "23:00",
                is_accepting_orders: true
            };
        }

        // بررسی اینکه آیا سیستم کلاً پذیرش سفارش را بسته است یا خیر
        if (!settings.is_accepting_orders) {
            return res.status(400).json({
                status: 'fail',
                message: 'در حال حاضر رستوران سفارشی نمی‌پذیرد (پذیرش سفارش غیرفعال است).'
            });
        }

        // گرفتن ساعت و دقیقه فعلی به وقت ایران یا سرور
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeMinutes = currentHours * 60 + currentMinutes;

        // تبدیل ساعت باز شدن (مثلا "08:00") به دقیقه
        const [openH, openM] = settings.opening_time.split(':').map(Number);
        const openingTimeMinutes = openH * 60 + openM;

        // تبدیل ساعت بسته شدن (مثلا "23:00") به دقیقه
        const [closeH, closeM] = settings.closing_time.split(':').map(Number);
        const closingTimeMinutes = closeH * 60 + closeM;

        // مقایسه زمان فعلی با بازه کاری
        if (currentTimeMinutes < openingTimeMinutes || currentTimeMinutes > closingTimeMinutes) {
            return res.status(400).json({
                status: 'fail',
                message: `ساعت کاری رستوران از ${settings.opening_time} تا ${settings.closing_time} است. در حال حاضر امکان ثبت سفارش وجود ندارد.`
            });
        }

        next(); // اگر همه چیز اوکی بود، برو مرحله بعد (ثبت سفارش)
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'خطا در بررسی ساعت کاری سیستم.',
            error: error.message
        });
    }
};

module.exports = checkWorkingHours;