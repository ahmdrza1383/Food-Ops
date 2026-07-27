const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister } = require('../middlewares/authValidator'); 

router.post('/register', validateRegister, authController.register);

module.exports = router;