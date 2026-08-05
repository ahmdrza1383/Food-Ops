const SystemSetting = require('../models/SystemSetting');

const checkWorkingHours = async (req, res, next) => {
    try {
        let settings = await SystemSetting.findOne();
        
        if (!settings) {
            settings = {
                opening_time: "08:00",
                closing_time: "23:00",
                is_accepting_orders: true
            };
        }

        if (!settings.is_accepting_orders) {
            return res.status(400).json({
                status: 'fail',
                message: 'در حال حاضر رستوران سفارشی نمی‌پذیرد (پذیرش سفارش غیرفعال است).'
            });
        }

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeMinutes = currentHours * 60 + currentMinutes;

        const [openH, openM] = settings.opening_time.split(':').map(Number);
        const openingTimeMinutes = openH * 60 + openM;

        const [closeH, closeM] = settings.closing_time.split(':').map(Number);
        const closingTimeMinutes = closeH * 60 + closeM;

        if (currentTimeMinutes < openingTimeMinutes || currentTimeMinutes > closingTimeMinutes) {
            return res.status(400).json({
                status: 'fail',
                message: `ساعت کاری رستوران از ${settings.opening_time} تا ${settings.closing_time} است. در حال حاضر امکان ثبت سفارش وجود ندارد.`
            });
        }

        next(); 
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'خطا در بررسی ساعت کاری سیستم.',
            error: error.message
        });
    }
};

module.exports = checkWorkingHours;