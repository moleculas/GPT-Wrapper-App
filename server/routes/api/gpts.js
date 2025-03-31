const express = require('express');
const router = express.Router();
const {
   getGPTs,
   getGPT,
   createGPT,
   updateGPT,
   deleteGPT,
   chatWithGPT,
   getAvailableGPTs,
   createThread,
   getThreadMessages,
   sendMessageToAssistant,
   deleteGPTThreads
} = require('../../controllers/gptController');
const { protect, authorize } = require('../../middleware/auth');
const { processBase64Files } = require('../../middleware/upload');

router.use(protect);

router.route('/')
  .get(getGPTs)
  .post(authorize('admin'), createGPT);

router.get('/available', authorize('admin'), getAvailableGPTs);

router.route('/:id')
  .get(getGPT)
  .put(updateGPT)
  .delete(deleteGPT);

router.post('/:id/chat', chatWithGPT);

router.post('/threads', createThread); 

router.post('/:id/threads', createThread);

router.get('/threads/:threadId/messages', getThreadMessages);

router.post('/:id/threads/:threadId/messages', processBase64Files, sendMessageToAssistant);

router.delete('/:id/threads', deleteGPTThreads);

module.exports = router;