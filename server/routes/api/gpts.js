const express = require('express');
const router = express.Router();

// @route    GET api/gpts
// @desc     Obtener todos los GPTs
// @access   Private
router.get('/', (req, res) => {
  res.send('Ruta para obtener todos los GPTs');
});

// @route    GET api/gpts/:id
// @desc     Obtener GPT por ID
// @access   Private
router.get('/:id', (req, res) => {
  res.send(`Ruta para obtener GPT con ID: ${req.params.id}`);
});

// @route    POST api/gpts
// @desc     Crear un nuevo GPT
// @access   Private/Admin
router.post('/', (req, res) => {
  res.send('Ruta para crear un nuevo GPT');
});

// @route    PUT api/gpts/:id
// @desc     Actualizar GPT
// @access   Private/Admin
router.put('/:id', (req, res) => {
  res.send(`Ruta para actualizar GPT con ID: ${req.params.id}`);
});

// @route    DELETE api/gpts/:id
// @desc     Eliminar GPT
// @access   Private/Admin
router.delete('/:id', (req, res) => {
  res.send(`Ruta para eliminar GPT con ID: ${req.params.id}`);
});

// @route    POST api/gpts/:id/chat
// @desc     Enviar mensaje a un GPT
// @access   Private
router.post('/:id/chat', (req, res) => {
  res.send(`Ruta para chatear con GPT con ID: ${req.params.id}`);
});

module.exports = router;