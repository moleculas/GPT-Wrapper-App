const express = require('express');
const router = express.Router();

// @route    GET api/users
// @desc     Obtener todos los usuarios
// @access   Private/Admin
router.get('/', (req, res) => {
  res.send('Ruta para obtener todos los usuarios');
});

// @route    GET api/users/:id
// @desc     Obtener usuario por ID
// @access   Private/Admin
router.get('/:id', (req, res) => {
  res.send(`Ruta para obtener usuario con ID: ${req.params.id}`);
});

// @route    PUT api/users/:id
// @desc     Actualizar usuario
// @access   Private/Admin
router.put('/:id', (req, res) => {
  res.send(`Ruta para actualizar usuario con ID: ${req.params.id}`);
});

// @route    DELETE api/users/:id
// @desc     Eliminar usuario
// @access   Private/Admin
router.delete('/:id', (req, res) => {
  res.send(`Ruta para eliminar usuario con ID: ${req.params.id}`);
});

module.exports = router;