const express = require('express');
const router = express.Router();

// @route    POST api/auth/register
// @desc     Registrar usuario
// @access   Public
router.post('/register', (req, res) => {
  res.send('Ruta para registrar usuario');
});

// @route    POST api/auth/login
// @desc     Autenticar usuario y obtener token
// @access   Public
router.post('/login', (req, res) => {
  res.send('Ruta para login de usuario');
});

// @route    GET api/auth/user
// @desc     Obtener información del usuario actual
// @access   Private
router.get('/user', (req, res) => {
  res.send('Ruta para obtener información del usuario actual');
});

module.exports = router;