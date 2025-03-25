const express = require('express');
const router = express.Router();
const { 
  getGPTs, 
  getGPT, 
  createGPT, 
  updateGPT, 
  deleteGPT,
  chatWithGPT
} = require('../../controllers/gptController');
const { protect, authorize } = require('../../middleware/auth');

// Proteger todas las rutas
router.use(protect);

// Rutas de GPTs
router.route('/')
  .get(getGPTs)
  .post(authorize('admin'), createGPT);

router.route('/:id')
  .get(getGPT)
  .put(updateGPT)
  .delete(deleteGPT);

// Ruta para chatear con un GPT
router.post('/:id/chat', chatWithGPT);

module.exports = router;