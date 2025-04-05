const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Ruta para obtener todos los usuarios');
});

router.get('/:id', (req, res) => {
  res.send(`Ruta para obtener usuario con ID: ${req.params.id}`);
});

router.put('/:id', (req, res) => {
  res.send(`Ruta para actualizar usuario con ID: ${req.params.id}`);
});

router.delete('/:id', (req, res) => {
  res.send(`Ruta para eliminar usuario con ID: ${req.params.id}`);
});

module.exports = router;