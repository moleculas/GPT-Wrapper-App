const mongoose = require('mongoose');

const GPTSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor proporciona un nombre para el GPT'],
    trim: true,
    maxlength: [100, 'El nombre no puede tener más de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor proporciona una descripción'],
    maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
  },
  instructions: {
    type: String,
    required: [true, 'Por favor proporciona las instrucciones del sistema'],
  },
  openaiId: {
    type: String,
    required: [true, 'Es necesario el ID de OpenAI'],
    unique: true
  },
  model: {
    type: String,
    required: [true, 'Por favor especifica el modelo base'],
    default: 'gpt-4'
  },
  imageUrl: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  allowedUsers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar la fecha de actualización
GPTSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('GPT', GPTSchema);