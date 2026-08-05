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
    const { name, description, price, category_id, image_url, status, stock_quantity, estimated_prep_time } = req.body;

    let imageUrl = image_url;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

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
      image_url: imageUrl,
      status: status !== undefined ? status : true,
      stock_quantity: stock_quantity !== undefined ? stock_quantity : 0,
      estimated_prep_time: estimated_prep_time !== undefined ? estimated_prep_time : 15
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

// @desc    Update menu item
// @route   PATCH /api/menu-items/:id
// @access  Private/Admin
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, status, image_url } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'فرمت شناسه آیتم (id) نامعتبر است.'
      });
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'آیتم منو با این شناسه یافت نشد.'
      });
    }

    let imageUrl = image_url;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (!imageUrl && menuItem.image_url) {
      imageUrl = menuItem.image_url;
    }

    const targetCategoryId = category_id || menuItem.category_id;
    if (category_id) {
      if (!mongoose.Types.ObjectId.isValid(category_id)) {
        return res.status(400).json({
          status: 'fail',
          message: 'فرمت شناسه دسته‌بندی جدید (category_id) نامعتبر است.'
        });
      }
      const categoryExists = await Category.findById(category_id);
      if (!categoryExists) {
        return res.status(404).json({
          status: 'fail',
          message: 'دسته‌بندی جدید با این شناسه یافت نشد.'
        });
      }
    }

    if (name || category_id) {
      const targetName = name || menuItem.name;
      const duplicateItem = await MenuItem.findOne({
        name: targetName,
        category_id: targetCategoryId,
        _id: { $ne: id }
      });

      if (duplicateItem) {
        return res.status(400).json({
          status: 'fail',
          message: 'یک آیتم دیگر با همین نام در این دسته‌بندی وجود دارد. لطفاً نام دیگری انتخاب کنید.'
        });
      }
    }

    const updateData = { ...req.body };
    if (imageUrl !== undefined) {
      updateData.image_url = imageUrl;
    }
    // delete updateData.image_url;

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category_id', 'name is_active');

    res.status(200).json({
      status: 'success',
      message: 'آیتم منو با موفقیت به‌روزرسانی شد.',
      data: {
        menuItem: updatedMenuItem
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در به‌روزرسانی آیتم منو رخ داد.',
      error: error.message
    });
  }
};

// @desc    Update menu item availability status (Toggle or Set)
// @route   PATCH /api/menu-items/:id/availability
// @access  Private/Admin
exports.updateMenuItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'فرمت شناسه آیتم (id) نامعتبر است.'
      });
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'آیتم منو با این شناسه یافت نشد.'
      });
    }

    if (req.body.status !== undefined) {
      menuItem.status = Boolean(req.body.status);
    } else {
      menuItem.status = !menuItem.status;
    }

    await menuItem.save();

    res.status(200).json({
      status: 'success',
      message: `وضعیت آیتم با موفقیت به «${menuItem.status ? 'فعال/موجود' : 'غیرفعال/ناموجود'}» تغییر یافت.`,
      data: {
        menuItem
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در تغییر وضعیت آیتم رخ داد.',
      error: error.message
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private/Admin
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'فرمت شناسه آیتم (id) نامعتبر است.'
      });
    }

    const deletedMenuItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedMenuItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'آیتم منو با این شناسه یافت نشد.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'آیتم منو با موفقیت حذف شد.',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در حذف آیتم منو رخ داد.',
      error: error.message
    });
  }
};