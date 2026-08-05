const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در دریافت دسته‌بندی‌ها رخ داد.',
      error: error.message
    });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, is_active } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        status: 'fail',
        message: 'یک دسته‌بندی با همین نام از قبل وجود دارد.'
      });
    }

    const newCategory = await Category.create({
      name,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      status: 'success',
      message: 'دسته‌بندی با موفقیت ایجاد شد.',
      data: {
        category: newCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در ایجاد دسته‌بندی رخ داد.',
      error: error.message
    });
  }
};

// @desc    Update a category
// @route   PATCH /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    if (name) {
      const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
      if (existingCategory) {
        return res.status(400).json({
          status: 'fail',
          message: 'یک دسته‌بندی دیگر با همین نام وجود دارد. لطفاً نام دیگری انتخاب کنید.'
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        status: 'fail',
        message: 'دسته‌بندی مورد نظر با این شناسه (ID) یافت نشد.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'دسته‌بندی با موفقیت به‌روزرسانی شد.',
      data: {
        category: updatedCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در به‌روزرسانی دسته‌بندی رخ داد.',
      error: error.message
    });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        status: 'fail',
        message: 'دسته‌بندی مورد نظر با این شناسه (ID) یافت نشد.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'دسته‌بندی با موفقیت حذف شد.',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'خطایی در حذف دسته‌بندی رخ داد.',
      error: error.message
    });
  }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'دسته‌بندی یافت نشد' });
        }
        res.status(200).json({ success: true, data: { category } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};