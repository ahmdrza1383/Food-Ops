const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'کاربر مربوط به این توکن دیگر وجود ندارد.' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'توکن نامعتبر است یا منقضی شده.' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'شما دسترسی لازم برای انجام این عملیات را ندارید.' });
        }
        next();
    };
};