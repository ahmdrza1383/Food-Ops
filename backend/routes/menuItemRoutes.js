const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', menuItemController.getAllMenuItems);
router.get('/:id', menuItemController.getMenuItemById);

router.post('/', protect, admin, menuItemController.createMenuItem);
router.patch('/:id', protect, admin, menuItemController.updateMenuItem);
router.patch('/:id/availability', protect, admin, menuItemController.updateMenuItemAvailability); 
router.delete('/:id', protect, admin, menuItemController.deleteMenuItem); 

module.exports = router;