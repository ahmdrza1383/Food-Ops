const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.get('/', menuItemController.getAllMenuItems);
router.get('/:id', menuItemController.getMenuItemById);

router.post('/', protect, admin, upload.single('image'), menuItemController.createMenuItem);
router.patch('/:id', protect, admin, upload.single('image'), menuItemController.updateMenuItem);
router.patch('/:id/availability', protect, admin, menuItemController.updateMenuItemAvailability);
router.delete('/:id', protect, admin, menuItemController.deleteMenuItem);

module.exports = router;