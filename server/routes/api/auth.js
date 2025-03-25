const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  logout,
  setup2FA,
  verify2FA,
  validate2FA
} = require('../../controllers/authController');
const { protect } = require('../../middleware/auth');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/2fa/validate', validate2FA);

// Rutas protegidas
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.get('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);

module.exports = router;