const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, admin } = require('../middlewares/authMiddleware'); 

router.get('/', categoryController.getAllCategories);

router.post('/', protect, admin, categoryController.createCategory);

router.patch('/:id', protect, admin, categoryController.updateCategory);

router.delete('/:id', protect, admin, categoryController.deleteCategory);

module.exports = router;