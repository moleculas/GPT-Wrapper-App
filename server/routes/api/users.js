const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser 
} = require('../../controllers/userController');

// @route    GET api/users
// @desc     Obtener todos los usuarios
// @access   Private/Admin
router.get('/', protect, authorize('admin'), getUsers);

// @route    GET api/users/:id
// @desc     Obtener usuario por ID
// @access   Private/Admin
router.get('/:id', protect, authorize('admin'), getUser);

// @route    PUT api/users/:id
// @desc     Actualizar usuario
// @access   Private/Admin o usuario propio
router.put('/:id', protect, updateUser);

// @route    DELETE api/users/:id
// @desc     Eliminar usuario
// @access   Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;