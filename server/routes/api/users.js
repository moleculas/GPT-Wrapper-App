const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser 
} = require('../../controllers/userController');
const { protect, authorize } = require('../../middleware/auth');

// Proteger todas las rutas
router.use(protect);

// Rutas de administrador
router.route('/')
  .get(authorize('admin'), getUsers);

router.route('/:id')
  .get(authorize('admin'), getUser)
  .put(updateUser) // El controlador ya verifica si puede actualizar
  .delete(authorize('admin'), deleteUser);

module.exports = router;