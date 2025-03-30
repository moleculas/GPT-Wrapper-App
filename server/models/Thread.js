const mongoose = require('mongoose');

const ThreadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  gptId: {
    type: mongoose.Schema.ObjectId,
    ref: 'GPT',
    required: true
  },
  openaiThreadId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
});

// Índice compuesto para búsquedas eficientes
ThreadSchema.index({ userId: 1, gptId: 1 }, { unique: true });

module.exports = mongoose.model('Thread', ThreadSchema);