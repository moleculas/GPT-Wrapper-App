const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser 
} = require('../../controllers/userController');

router.get('/', protect, authorize('admin'), getUsers);

router.get('/:id', protect, authorize('admin'), getUser);

router.put('/:id', protect, updateUser);

router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;