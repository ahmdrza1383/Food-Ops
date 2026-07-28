const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role'); 

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


exports.admin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.role_id) {
      return res.status(403).json({
        status: 'fail',
        message: 'دسترسی غیرمجاز. اطلاعات نقش کاربر یافت نشد.'
      });
    }

    const userRole = await Role.findById(req.user.role_id);

    if (!userRole || (userRole.name !== 'Admin' && userRole.name !== 'admin')) {
      return res.status(403).json({
        status: 'fail',
        message: 'دسترسی محدود شده است! فقط مدیران سیستم می‌توانند این کار را انجام دهند.'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطا در بررسی دسترسی کاربر.',
      error: error.message
    });
  }
};