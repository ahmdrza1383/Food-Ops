const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');

// @desc    Register a new user (Customer by default)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { fullname, phone_number, password } = req.body;

        const userExists = await User.findOne({ phone_number });
        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'کاربری با این شماره تماس قبلاً ثبت‌نام کرده است.' 
            });
        }

        const customerRole = await Role.findOne({ name: 'Customer' });
        if (!customerRole) {
            return res.status(500).json({ 
                success: false, 
                message: 'خطای سیستمی: نقش پیش‌فرض مشتری در دیتابیس یافت نشد.' 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullname,
            phone_number,
            password: hashedPassword,
            role_id: customerRole._id
        });

        res.status(201).json({
            success: true,
            message: 'ثبت‌نام با موفقیت انجام شد.',
            data: {
                _id: newUser._id,
                fullname: newUser.fullname,
                phone_number: newUser.phone_number,
                role_id: newUser.role_id
            }
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطایی در سرور رخ داد.', 
            error: error.message 
        });
    }
};