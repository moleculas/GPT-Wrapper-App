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

exports.sendMessageToAssistant = async (req, res) => {
  try {
    const { id, threadId } = req.params;
    const { message } = req.body;

    const gpt = await GPT.findById(id);
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'Asistente no encontrado'
      });
    }

    // Verificación de permisos
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
    
    // Crear el mensaje
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message || "Por favor analiza el contenido proporcionado"
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

// @desc    Subir archivo a un asistente con prefijo user_
// @route   POST /api/gpts/:id/files
// @access  Private
exports.uploadAssistantFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { files } = req.body;

    // Verificar que el GPT existe
    const gpt = await GPT.findById(id);
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }

    // Verificar permisos
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

    // Procesar archivos si existen
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se han proporcionado archivos'
      });
    }

    const uploadedFiles = [];
    const errorFiles = [];

    for (const file of files) {
      let tempFilePath;
      try {
        console.log(`Procesando archivo: ${file.name}, ${file.type}, ${file.size}`);
        
        // Verificar que la data existe
        if (!file.data) {
          errorFiles.push({
            name: file.name,
            error: 'Datos de archivo no válidos'
          });
          continue;
        }
        
        // Convertir data base64 a buffer
        const fileData = Buffer.from(file.data, 'base64');
        
        if (fileData.length === 0) {
          errorFiles.push({
            name: file.name,
            error: 'Buffer vacío después de convertir base64'
          });
          continue;
        }

        // Añadir prefijo user_ al nombre del archivo
        const userFileName = `user_${file.name}`;
        
        // Crear directorio de uploads si no existe
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Crear archivo temporal en disco
        tempFilePath = path.join(uploadDir, `${Date.now()}-${userFileName}`);
        fs.writeFileSync(tempFilePath, fileData);
        
        console.log(`Archivo temporal creado: ${tempFilePath}`);
        
        // Subir archivo a OpenAI
        const uploadedFile = await openai.files.create({
          file: fs.createReadStream(tempFilePath),
          purpose: 'assistants',
          filename: userFileName // Usar el nombre con prefijo
        });
        
        console.log(`Archivo subido a OpenAI con ID: ${uploadedFile.id}`);
        
        // Obtener el asistente para ver archivos actuales
        const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
        
        // Añadir el nuevo archivo a la lista de archivos del asistente
        let currentFileIds = assistant.file_ids || [];
        currentFileIds.push(uploadedFile.id);
        
        // Asegurarse de que el asistente tiene la herramienta de búsqueda en archivos
        let currentTools = assistant.tools || [];
        if (!currentTools.some(tool => tool.type === 'file_search')) {
          currentTools.push({ type: 'file_search' });
        }
        
        // Actualizar el asistente con el nuevo archivo
        await openai.beta.assistants.update(gpt.openaiId, {
          file_ids: currentFileIds,
          tools: currentTools
        });
        
        console.log(`Asistente ${gpt.openaiId} actualizado con el nuevo archivo`);
        
        // Eliminar archivo temporal después de subirlo
        fs.unlinkSync(tempFilePath);
        
        // Añadir archivo a la lista de éxitos
        uploadedFiles.push({
          name: userFileName,
          originalName: file.name,
          openai_id: uploadedFile.id,
          type: file.type,
          size: file.size
        });
      } catch (fileError) {
        console.error(`Error procesando archivo ${file.name}:`, fileError);
        
        // Eliminar archivo temporal si existe
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (unlinkError) {
            console.error('Error al eliminar archivo temporal:', unlinkError);
          }
        }
        
        // Añadir a errores
        errorFiles.push({
          name: file.name,
          error: fileError.message
        });
      }
    }

    // Responder con estado de la operación
    res.status(200).json({
      success: true,
      data: {
        uploaded: uploadedFiles,
        errors: errorFiles
      }
    });
  } catch (err) {
    console.error('Error al subir archivos al asistente:', err);
    res.status(500).json({
      success: false,
      error: 'Error al procesar los archivos',
      details: err.message
    });
  }
};

// @desc    Obtener archivos de usuario de un asistente (con prefijo user_)
// @route   GET /api/gpts/:id/files
// @access  Private
exports.getAssistantUserFiles = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el GPT existe
    const gpt = await GPT.findById(id);
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }
    
    // Verificar permisos para ver el asistente
    if (
      req.user.role !== 'admin' &&
      !gpt.isPublic &&
      gpt.createdBy.toString() !== req.user.id &&
      !gpt.allowedUsers.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver este GPT'
      });
    }
    
    // Obtener los archivos del asistente desde OpenAI
    const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
    
    // Si no hay file_ids, devolver lista vacía
    if (!assistant.file_ids || assistant.file_ids.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Obtener detalles de cada archivo
    const userFiles = [];
    
    for (const fileId of assistant.file_ids) {
      try {
        const fileInfo = await openai.files.retrieve(fileId);
        
        // Solo incluir archivos con prefijo user_
        if (fileInfo.filename && fileInfo.filename.startsWith('user_')) {
          userFiles.push({
            id: fileInfo.id,
            filename: fileInfo.filename,
            bytes: fileInfo.bytes,
            created_at: fileInfo.created_at,
            purpose: fileInfo.purpose
          });
        }
      } catch (error) {
        console.error(`Error al obtener detalles del archivo ${fileId}:`, error);
      }
    }
    
    res.status(200).json({
      success: true,
      data: userFiles
    });
  } catch (err) {
    console.error('Error al obtener archivos del asistente:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los archivos',
      details: err.message
    });
  }
};

// @desc    Eliminar un archivo de usuario de un asistente
// @route   DELETE /api/gpts/:id/files/:fileId
// @access  Private
exports.deleteAssistantFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    // Verificar que el GPT existe
    const gpt = await GPT.findById(id);
    if (!gpt) {
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }
    
    // Verificar permisos
    if (
      req.user.role !== 'admin' &&
      !gpt.isPublic &&
      gpt.createdBy.toString() !== req.user.id &&
      !gpt.allowedUsers.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para modificar este GPT'
      });
    }
    
    // Obtener información del archivo
    try {
      const fileInfo = await openai.files.retrieve(fileId);
      
      // Verificar que es un archivo de usuario (con prefijo user_)
      if (!fileInfo.filename || !fileInfo.filename.startsWith('user_')) {
        return res.status(403).json({
          success: false,
          error: 'Solo puedes eliminar archivos de usuario (con prefijo user_)'
        });
      }
      
      // Obtener el asistente actual
      const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
      
      // Verificar que el archivo está asociado al asistente
      if (!assistant.file_ids || !assistant.file_ids.includes(fileId)) {
        return res.status(404).json({
          success: false,
          error: 'Archivo no encontrado en este asistente'
        });
      }
      
      // Eliminar el archivo del asistente
      const updatedFileIds = assistant.file_ids.filter(id => id !== fileId);
      
      await openai.beta.assistants.update(gpt.openaiId, {
        file_ids: updatedFileIds
      });
      
      // Intentar eliminar el archivo de OpenAI
      await openai.files.del(fileId);
      
      res.status(200).json({
        success: true,
        message: `Archivo ${fileInfo.filename} eliminado correctamente`
      });
    } catch (fileError) {
      console.error(`Error al procesar archivo ${fileId}:`, fileError);
      res.status(500).json({
        success: false,
        error: 'Error al procesar el archivo',
        details: fileError.message
      });
    }
  } catch (err) {
    console.error('Error al eliminar archivo del asistente:', err);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el archivo',
      details: err.message
    });
  }
};