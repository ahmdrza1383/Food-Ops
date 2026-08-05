const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

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

        const token = signToken(newUser._id);

        res.status(201).json({
            success: true,
            message: 'ثبت‌نام با موفقیت انجام شد.',
            token,
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { phone_number, password } = req.body;

        const user = await User.findOne({ phone_number }).select('+password');
        const isMatch = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !isMatch) {
            return res.status(200).json({
                success: false,
                message: 'شماره تماس یا رمز عبور اشتباه است.'
            });
        }

        const token = signToken(user._id);

        res.status(200).json({
            success: true,
            message: 'با موفقیت وارد شدید.',
            token,
            data: {
                _id: user._id,
                fullname: user.fullname,
                phone_number: user.phone_number,
                role_id: user.role_id
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'خطایی در سرور رخ داد.',
            error: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = req.user;

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                fullname: user.fullname,
                phone_number: user.phone_number,
                role_id: user.role_id
            }
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت اطلاعات کاربر.'
        });
    }
};

// @desc    Log user out / clear cookie (if any)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'با موفقیت خارج شدید. (لطفاً توکن را از کلاینت پاک کنید)'
    });
};