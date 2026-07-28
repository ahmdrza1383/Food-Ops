--- backend / middlewares / errorHandler.js(原始)


+++ backend / middlewares / errorHandler.js(修改后)
// Error Handler Middleware - Handles all errors across the API
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    } else {
        console.error('Error:', err.message);
    }

    // Mongoose Bad ObjectId
    if (err.name === 'CastError') {
        const message = 'شناسه وارد شده معتبر نیست.';
        return res.status(400).json({
            success: false,
            status: 'fail',
            message,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Mongoose Duplicate Key (Unique Constraint Violation)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `مقدار تکراری برای فیلد "${field}" وارد شده است.`;
        return res.status(400).json({
            success: false,
            status: 'fail',
            message,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            status: 'fail',
            message: messages.join(' '),
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'توکن نامعتبر است.';
        return res.status(401).json({
            success: false,
            status: 'fail',
            message,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'مهلت اعتبار توکن به پایان رسیده است.';
        return res.status(401).json({
            success: false,
            status: 'fail',
            message,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Multer Errors (File Upload)
    if (err.name === 'MulterError') {
        let message = 'خطا در بارگذاری فایل.';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'حجم فایل بیش از حد مجاز است.';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'تعداد فایل‌ها بیش از حد مجاز است.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'فایل غیرمنتظره دریافت شد.';
        }
        return res.status(400).json({
            success: false,
            status: 'fail',
            message,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // SyntaxError (JSON Parse Error)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        const message = 'فرمت داده‌های ارسالی معتبر نیست (JSON نامعتبر).';
        return res.status(400).json({
            success: false,
            status: 'fail',
            message,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Default Error Response
    res.status(err.statusCode || err.status || 500).json({
        success: false,
        status: err.status || 'error',
        message: err.message || 'خطای داخلی سرور رخ داد.',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// Async Handler Wrapper - Wraps async route handlers to catch errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };