// تابعی برای پاک‌سازی بازگشتی کلیدهای خطرناک از آبجکت‌ها
const sanitizeObject = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            // اگر نام کلید با $ شروع شود یا شامل . باشد، حذف می‌شود
            if (/^\$|\./.test(key)) {
                delete obj[key];
            } else {
                sanitizeObject(obj[key]);
            }
        }
    }
    return obj;
};

// میان‌افزار سراسری برای پاک‌سازی بدنه، کوئری و پارامترهای درخواست
const sanitize = (req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    next();
};

module.exports = sanitize;