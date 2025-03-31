const GPT = require('../models/GPT');
const Thread = require('../models/Thread');
const User = require('../models/User');
const axios = require('axios');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// @desc    Obtener todos los GPTs
// @route   GET /api/gpts
// @access  Private
exports.getGPTs = async (req, res) => {
  try {
    let query;

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
    req.body.createdBy = req.user.id;

    if (!req.body.allowedUsers) {
      req.body.allowedUsers = [];
    }

    if (!req.body.isPublic && !req.body.allowedUsers.includes(req.user.id)) {
      req.body.allowedUsers.push(req.user.id);
    }

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

    if (req.user.role !== 'admin' && gpt.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para modificar este GPT'
      });
    }

    if (req.body.allowedUsers && !req.body.isPublic) {
      const creatorId = gpt.createdBy.toString();
      if (!req.body.allowedUsers.includes(creatorId)) {
        req.body.allowedUsers.push(creatorId);
      }
    }

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

    try {
      const openaiResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: gpt.model,
          messages: [
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

// @desc    Obtener GPTs disponibles desde OpenAI
// @route   GET /api/gpts/available
// @access  Private (Admin)
exports.getAvailableGPTs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden acceder a esta funcionalidad'
      });
    }
    const assistants = await openai.beta.assistants.list({
      limit: 100,
      order: 'desc'
    });
    if (!assistants || !assistants.data) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    const formattedAssistants = assistants.data.map(assistant => ({
      id: assistant.id,
      name: assistant.name || 'GPT sin nombre',
      description: assistant.description || '',
      model: assistant.model
    }));
    res.status(200).json({
      success: true,
      count: formattedAssistants.length,
      data: formattedAssistants
    });
  } catch (err) {
    console.error('Error al obtener GPTs de OpenAI:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener GPTs disponibles',
      details: err.message
    });
  }
};

// @desc    Crear un nuevo thread
// @route   POST /api/gpts/threads
// @access  Private
// Ruta: server/controllers/gptController.js

exports.createThread = async (req, res) => {
  try {
    const gptId = req.params.id || req.body.gptId;

    if (!gptId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un ID de GPT'
      });
    }

    const gpt = await GPT.findById(gptId);
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }

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

    let threadDoc = await Thread.findOne({
      userId: req.user.id,
      gptId: gptId
    });

    if (threadDoc) {
      threadDoc.lastActivityAt = Date.now();
      await threadDoc.save();

      return res.status(200).json({
        success: true,
        data: {
          id: threadDoc.openaiThreadId
        }
      });
    }

    const user = await User.findById(req.user.id);

    const openaiThread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(openaiThread.id, {
      role: "user",
      content: `Utiliza el nombre del usuario "${user.name}" para saludarlo en el primer mensaje de cada conversación (por ejemplo: "Hola, ${user.name}"). No es necesario que lo menciones en cada mensaje posterior, solo úsalo de manera natural cuando la conversación lo requiera. Esta es una instrucción del sistema.`, metadata: { system_instruction: "true" }
    });

    const run = await openai.beta.threads.runs.create(openaiThread.id, {
      assistant_id: gpt.openaiId
    });

    await waitForRunCompletion(openaiThread.id, run.id);

    threadDoc = await Thread.create({
      userId: req.user.id,
      gptId: gptId,
      openaiThreadId: openaiThread.id
    });

    res.status(201).json({
      success: true,
      data: {
        id: openaiThread.id
      }
    });
  } catch (err) {
    console.error('Error al crear thread:', err);
    res.status(500).json({
      success: false,
      error: 'Error al crear el hilo de conversación',
      details: err.message
    });
  }
};

async function waitForRunCompletion(threadId, runId) {
  let runStatus;
  let attempts = 0;
  const maxAttempts = 30;

  do {
    runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    if (runStatus.status === 'completed' ||
      runStatus.status === 'failed' ||
      runStatus.status === 'cancelled' ||
      runStatus.status === 'expired') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  } while (attempts < maxAttempts);

  return runStatus;
}

// @desc    Obtener mensajes de un thread
// @route   GET /api/gpts/threads/:threadId/messages
// @access  Private
exports.getThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;

    const messages = await openai.beta.threads.messages.list(threadId);

    res.status(200).json({
      success: true,
      data: messages.data.reverse()
    });
  } catch (err) {
    console.error('Error al obtener mensajes del thread:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los mensajes',
      details: err.message
    });
  }
};

// @desc    Eliminar thread de un usuario y GPT específicos
// @route   DELETE /api/gpts/:id/threads
// @access  Private
exports.deleteGPTThreads = async (req, res) => {
  try {
    const gptId = req.params.id;
    const userId = req.user.id;

    const threads = await Thread.find({
      userId: userId,
      gptId: gptId
    });

    if (threads.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron conversaciones para resetear'
      });
    }

    for (const thread of threads) {
      try {
        await openai.beta.threads.del(thread.openaiThreadId);
      } catch (openaiError) {
        console.error(`Error eliminando thread ${thread.openaiThreadId} en OpenAI:`, openaiError);
      }
    }

    await Thread.deleteMany({
      userId: userId,
      gptId: gptId
    });

    res.status(200).json({
      success: true,
      message: `Se han eliminado ${threads.length} conversaciones`
    });
  } catch (err) {
    console.error('Error al eliminar threads:', err);
    res.status(500).json({
      success: false,
      error: 'Error al resetear la memoria de conversación',
      details: err.message
    });
  }
};

// @desc    Enviar mensaje a un asistente en un thread específico
// @route   POST /api/gpts/:id/threads/:threadId/messages
// @access  Private
exports.sendMessageToAssistant = async (req, res) => {
  try {
    const { id, threadId } = req.params;
    const { message, files } = req.body;

    const gpt = await GPT.findById(id);
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'Asistente no encontrado'
      });
    }

    if (
      req.user.role !== 'admin' &&
      !gpt.isPublic &&
      gpt.createdBy.toString() !== req.user.id &&
      !gpt.allowedUsers.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para usar este asistente'
      });
    }

    // Variable para almacenar contenido extraído de archivos
    let extractedContent = '';
    
    // Procesar archivos si existen
    if (files && files.length > 0) {
      console.log('Procesando archivos:', files.length);
      
      for (const file of files) {
        let tempFilePath;
        try {
          console.log('Procesando archivo:', file.name, file.type, file.size);
          
          // Verificar que la data existe
          if (!file.data) {
            console.error('Error: file.data está vacío o no es válido');
            continue;
          }
          
          // Convertir data base64 a buffer
          const fileData = Buffer.from(file.data, 'base64');
          
          if (fileData.length === 0) {
            console.error('Error: Buffer vacío después de convertir base64');
            continue;
          }
          
          // Si es un archivo de texto, extraer su contenido
          if (file.type === 'text/plain') {
            const textContent = fileData.toString('utf-8');
            extractedContent += `\n\n### Contenido del archivo: ${file.name}\n\n${textContent}`;
            console.log(`Contenido extraído del archivo ${file.name}`);
          } else {
            // Para otros tipos de archivos, intentamos subirlos a OpenAI
            // Crear directorio de uploads si no existe
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            // Crear archivo temporal en disco
            tempFilePath = path.join(uploadDir, `${Date.now()}-${file.name}`);
            fs.writeFileSync(tempFilePath, fileData);
            
            console.log('Archivo temporal creado:', tempFilePath);
            
            // Verificar que el archivo existe
            if (!fs.existsSync(tempFilePath)) {
              console.error('Error: Archivo temporal no fue creado correctamente');
              continue;
            }
            
            extractedContent += `\n\n### Archivo adjunto: ${file.name} (no se puede mostrar contenido directamente)`;
            
            // Eliminar archivo temporal cuando hemos terminado
            fs.unlinkSync(tempFilePath);
          }
        } catch (fileError) {
          console.error('Error procesando archivo:', fileError);
          
          // Eliminar archivo temporal si existe
          if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
              fs.unlinkSync(tempFilePath);
            } catch (unlinkError) {
              console.error('Error al eliminar archivo temporal:', unlinkError);
            }
          }
          
          // Continuar con el siguiente archivo
          continue;
        }
      }
    }
    
    // Construir mensaje completo con el contenido extraído
    let fullMessage = message || "Por favor analiza el contenido proporcionado";
    
    if (extractedContent) {
      fullMessage += `\n\n${extractedContent}`;
    }
    
    console.log('Creando mensaje con contenido de archivos extraído');
    
    // Crear mensaje con el contenido combinado
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: fullMessage
    });
    
    console.log('Mensaje creado, ejecutando asistente');
    
    // Ejecutar el asistente
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: gpt.openaiId
    });

    console.log('Run creado:', run.id, 'estado inicial:', run.status);
    
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 60; // 1 minuto máximo (60 intentos de 1 segundo)
    
    console.log('Esperando finalización del run...');
    
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`Esperando... Estado: ${runStatus.status}, intentos: ${attempts}/${maxAttempts}`);
      }
    }

    console.log('Run completado con estado:', runStatus.status);
    
    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);

      res.status(200).json({
        success: true,
        data: messages.data.reverse()
      });
    } else {
      console.error('Run no completado:', runStatus);
      
      res.status(500).json({
        success: false,
        error: `La ejecución terminó con estado: ${runStatus.status}`,
        details: runStatus
      });
    }
  } catch (err) {
    console.error('Error al enviar mensaje al asistente:', err);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el mensaje',
      details: err.message
    });
  }
};