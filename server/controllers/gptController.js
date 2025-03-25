const GPT = require('../models/GPT');
const axios = require('axios');

// @desc    Obtener todos los GPTs
// @route   GET /api/gpts
// @access  Private
exports.getGPTs = async (req, res) => {
  try {
    let query;
    
    // Si el usuario no es admin, solo ve GPTs públicos o creados por él
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { isPublic: true },
          { createdBy: req.user.id },
          { allowedUsers: req.user.id }
        ]
      };
    }
    
    const gpts = await GPT.find(query).populate({
      path: 'createdBy',
      select: 'name email'
    });
    
    res.status(200).json({
      success: true,
      count: gpts.length,
      data: gpts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Obtener un GPT por ID
// @route   GET /api/gpts/:id
// @access  Private
exports.getGPT = async (req, res) => {
  try {
    const gpt = await GPT.findById(req.params.id).populate({
      path: 'createdBy',
      select: 'name email'
    });
    
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }
    
    // Verificar si el usuario tiene acceso a este GPT
    if (
      req.user.role !== 'admin' && 
      !gpt.isPublic && 
      gpt.createdBy._id.toString() !== req.user.id &&
      !gpt.allowedUsers.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para acceder a este GPT'
      });
    }
    
    res.status(200).json({
      success: true,
      data: gpt
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Crear un nuevo GPT
// @route   POST /api/gpts
// @access  Private (Admin)
exports.createGPT = async (req, res) => {
  try {
    // Añadir usuario a req.body
    req.body.createdBy = req.user.id;
    
    // Comprobar si existe un GPT con el mismo openaiId
    const existingGPT = await GPT.findOne({ openaiId: req.body.openaiId });
    if (existingGPT) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un GPT con ese ID de OpenAI'
      });
    }
    
    const gpt = await GPT.create(req.body);
    
    res.status(201).json({
      success: true,
      data: gpt
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Actualizar un GPT
// @route   PUT /api/gpts/:id
// @access  Private (Admin o creador)
exports.updateGPT = async (req, res) => {
  try {
    let gpt = await GPT.findById(req.params.id);
    
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }
    
    // Verificar si el usuario puede modificar este GPT
    if (req.user.role !== 'admin' && gpt.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para modificar este GPT'
      });
    }
    
    // Actualizar GPT
    gpt = await GPT.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: gpt
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Eliminar un GPT
// @route   DELETE /api/gpts/:id
// @access  Private (Admin o creador)
exports.deleteGPT = async (req, res) => {
  try {
    const gpt = await GPT.findById(req.params.id);
    
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }
    
    // Verificar si el usuario puede eliminar este GPT
    if (req.user.role !== 'admin' && gpt.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para eliminar este GPT'
      });
    }
    
    await gpt.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Enviar mensaje a un GPT
// @route   POST /api/gpts/:id/chat
// @access  Private
exports.chatWithGPT = async (req, res) => {
  try {
    const { message, files } = req.body;
    const gpt = await GPT.findById(req.params.id);
    
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }
    
    // Verificar si el usuario tiene acceso a este GPT
    if (
      req.user.role !== 'admin' && 
      !gpt.isPublic && 
      gpt.createdBy.toString() !== req.user.id &&
      !gpt.allowedUsers.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para usar este GPT'
      });
    }
    
    // Aquí iría la integración con la API de OpenAI
    // Este es un ejemplo simplificado
    try {
      // Configuración de la petición a OpenAI
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: gpt.model,
          messages: [
            {
              role: 'system',
              content: gpt.instructions
            },
            {
              role: 'user',
              content: message
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.status(200).json({
        success: true,
        data: openaiResponse.data
      });
    } catch (openaiError) {
      res.status(500).json({
        success: false,
        error: 'Error al comunicarse con OpenAI',
        details: openaiError.response ? openaiError.response.data : openaiError.message
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};