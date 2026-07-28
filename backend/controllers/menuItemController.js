const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// @desc    Get all menu items
// @route   GET /api/menu-items
// @access  Public
exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find()
      .populate('category_id', 'name is_active')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: menuItems.length,
      data: {
        menuItems
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در دریافت آیتم‌های منو رخ داد.',
      error: error.message
    });
  }
};

// @desc    Get single menu item
// @route   GET /api/menu-items/:id
// @access  Public
exports.getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id)
      .populate('category_id', 'name is_active');

    if (!menuItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'آیتم منو با این شناسه (ID) یافت نشد.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        menuItem
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در دریافت اطلاعات آیتم منو رخ داد.',
      error: error.message
    });
  }
};

// @desc    Create a new menu item
// @route   POST /api/menu-items
// @access  Private/Admin
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category_id, is_available } = req.body;

    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'فرمت شناسه دسته‌بندی (category_id) نامعتبر است.'
      });
    }

    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'دسته‌بندی مورد نظر با این شناسه (category_id) یافت نشد.'
      });
    }

    const itemExists = await MenuItem.findOne({ name, category_id });
    if (itemExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'یک آیتم با همین نام در این دسته‌بندی وجود دارد. لطفاً نام دیگری انتخاب کنید.'
      });
    }

    const newMenuItem = await MenuItem.create({
      name,
      description,
      price,
      category_id,
      is_available: is_available !== undefined ? is_available : true
    });

    res.status(201).json({
      status: 'success',
      message: 'آیتم جدید با موفقیت به منو اضافه شد.',
      data: {
        menuItem: newMenuItem
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در ایجاد آیتم منو رخ داد.',
      error: error.message
    });
  }
};