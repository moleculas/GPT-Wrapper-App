const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  logout,
  setup2FA,
  verify2FA,
  validate2FA,
  changePassword
} = require('../../controllers/authController');
const { protect } = require('../../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/2fa/validate', validate2FA);
router.post('/change-password', protect, changePassword);

router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.get('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);

module.exports = router;