const isValidIranianPhone = (phone) => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
};

exports.validateRegister = (req, res, next) => {
    const { fullname, phone_number, password } = req.body;

    if (!fullname || !phone_number || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'لطفاً تمام فیلدها (نام کامل، شماره تماس و رمز عبور) را وارد کنید.' 
        });
    }

    if (!isValidIranianPhone(phone_number)) {
        return res.status(400).json({ 
            success: false, 
            message: 'شماره تلفن نامعتبر است. شماره باید با 09 شروع شده و دقیقاً ۱۱ رقم باشد.' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' 
        });
    }

    next();
};