const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRegister, validateLogin } = require('../middlewares/authValidator');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;