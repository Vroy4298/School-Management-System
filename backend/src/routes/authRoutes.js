const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLoginInput } = require('../validators/authValidator');
const { authenticate } = require('../middleware/auth');

// Public route: Login
router.post('/login', validateLoginInput, authController.login);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
