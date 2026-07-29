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
    req.user = await User.findById(decoded.id).populate('role_id').select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'کاربر مربوط به این توکن دیگر وجود ندارد.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'توکن نامعتبر است یا منقضی شده.' });
  }
};

// exports.authorize = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.user.role)) {
//             return res.status(403).json({ message: 'شما دسترسی لازم برای انجام این عملیات را ندارید.' });
//         }
//         next();
//     };
// };


exports.admin = (req, res, next) => {
  const roleName = req.user?.role_id?.name?.toLowerCase();
  if (roleName !== 'admin') {
    return res.status(403).json({ status: 'fail', message: 'دسترسی فقط برای مدیر سیستم مجاز است.' });
  }
  next();
};

exports.kitchenStaffOrAdmin = (req, res, next) => {
  const roleName = req.user?.role_id?.name?.toLowerCase();
  const allowedRoles = ['admin', 'kitchen staff'];

  if (!allowedRoles.includes(roleName)) {
    return res.status(403).json({ status: 'fail', message: 'این بخش فقط مخصوص پرسنل آشپزخانه و مدیر است.' });
  }
  next();
};

exports.customerOnly = (req, res, next) => {
  const roleName = req.user?.role_id?.name?.toLowerCase();
  if (roleName !== 'customer') {
    return res.status(403).json({ status: 'fail', message: 'این عملیات فقط برای حساب‌های مشتری مجاز است.' });
  }
  next();
};

exports.cashierOrAdmin = (req, res, next) => {
  const roleName = req.user?.role_id?.name?.toLowerCase();
  const allowedRoles = ['admin', 'cashier'];

  if (!allowedRoles.includes(roleName)) {
    return res.status(403).json({
      status: 'fail',
      message: 'این بخش فقط مخصوص صندوق‌دار و مدیر سیستم است.'
    });
  }
  next();
};