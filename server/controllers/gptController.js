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

// server/controllers/gptController.js
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
    const fileIds = [];

    // Primero, subimos todos los archivos a OpenAI
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

        // Crear directorio de uploads si no existe
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Crear archivo temporal en disco
        tempFilePath = path.join(uploadDir, `${file.name}`);
        fs.writeFileSync(tempFilePath, fileData);

        console.log(`Archivo temporal creado: ${tempFilePath}`);

        // Subir archivo a OpenAI con propósito assistants
        const uploadedFile = await openai.files.create({
          file: fs.createReadStream(tempFilePath),
          purpose: 'assistants'
        });

        console.log(`Archivo subido a OpenAI con ID: ${uploadedFile.id}`);
        fileIds.push(uploadedFile.id);

        // Eliminar archivo temporal después de subirlo
        fs.unlinkSync(tempFilePath);

        // Añadir archivo a la lista de éxitos
        uploadedFiles.push({
          name: file.name,
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

    // Si se subieron archivos con éxito, crear un vector store
    if (fileIds.length > 0) {
      try {
        // Crear un nombre seguro para el vector store
        const safeGptName = gpt.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const vectorStoreName = `${safeGptName}_${Date.now()}`;

        console.log(`Creando vector store "${vectorStoreName}" con archivos: ${fileIds.join(', ')}`);

        // Crear un vector store usando axios directamente con la API de OpenAI
        const vectorStoreResponse = await axios.post(
          'https://api.openai.com/v1/vector_stores',
          {
            name: vectorStoreName,
            file_ids: fileIds
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            }
          }
        );

        const vectorStore = vectorStoreResponse.data;
        console.log(`Vector store creado con ID: ${vectorStore.id}`);

        // Esperar un momento para asegurarnos de que el vector store está listo
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Obtener el asistente actual
        const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);

        // Verificar si tiene la herramienta file_search y añadirla si no la tiene
        let tools = assistant.tools || [];
        if (!tools.some(tool => tool.type === 'file_search')) {
          tools.push({ type: 'file_search' });
        }

        // Obtener los vector stores actuales y añadir el nuevo
        let toolResources = assistant.tool_resources || {};
        let fileSearch = toolResources.file_search || {};
        let vectorStoreIds = fileSearch.vector_store_ids || [];

        // Añadir el nuevo vector store
        vectorStoreIds.push(vectorStore.id);

        // Actualizar el asistente con el nuevo vector store
        console.log(`Actualizando asistente ${gpt.openaiId} con vector stores: ${vectorStoreIds.join(', ')}`);

        await openai.beta.assistants.update(gpt.openaiId, {
          tools: tools,
          tool_resources: {
            file_search: {
              vector_store_ids: vectorStoreIds
            }
          }
        });

        console.log(`Asistente actualizado correctamente con el vector store`);
      } catch (vectorStoreError) {
        console.error('Error al crear o asociar el vector store:', vectorStoreError);

        // Si falla la creación del vector store, intentar añadir los archivos directamente al asistente
        try {
          console.log('Intentando método alternativo: añadir archivos directamente al asistente');

          // Obtener el asistente actual
          const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);

          // Obtener los file_ids actuales
          let currentFileIds = assistant.file_ids || [];

          // Añadir los nuevos archivos
          const updatedFileIds = [...currentFileIds, ...fileIds];

          await openai.beta.assistants.update(gpt.openaiId, {
            file_ids: updatedFileIds
          });

          console.log(`Método alternativo: asistente actualizado con ${fileIds.length} nuevos archivos`);
        } catch (fallbackError) {
          console.error('Error también en el método alternativo:', fallbackError);
        }
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

exports.getAssistantUserFiles = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Obteniendo archivos para el asistente con ID: ${id}`);

    // Verificar que el GPT existe
    const gpt = await GPT.findById(id);
    if (!gpt) {
      console.log('GPT no encontrado');
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }

    console.log(`GPT encontrado, ID de OpenAI: ${gpt.openaiId}`);

    // Verificar permisos para ver el asistente
    if (
      req.user.role !== 'admin' &&
      !gpt.isPublic &&
      gpt.createdBy.toString() !== req.user.id &&
      !gpt.allowedUsers.includes(req.user.id)
    ) {
      console.log('Usuario sin permisos para ver este GPT');
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver este GPT'
      });
    }

    // Obtener el asistente para ver sus archivos y vector stores
    console.log(`Recuperando asistente desde OpenAI con ID: ${gpt.openaiId}`);
    const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
    const allFiles = [];

    // 1. Comprobar si el asistente tiene archivos directamente asociados
    if (assistant.file_ids && assistant.file_ids.length > 0) {
      console.log(`El asistente tiene ${assistant.file_ids.length} archivos directamente asociados`);
      
      for (const fileId of assistant.file_ids) {
        try {
          const fileInfo = await openai.files.retrieve(fileId);
          allFiles.push({
            id: fileInfo.id,
            filename: fileInfo.filename,
            bytes: fileInfo.bytes,
            created_at: fileInfo.created_at,
            purpose: fileInfo.purpose,
            source: 'direct'
          });
        } catch (error) {
          console.error(`Error al obtener detalles del archivo ${fileId}:`, error);
        }
      }
    }

    // 2. Comprobar si el asistente tiene vector stores
    if (assistant.tool_resources &&
        assistant.tool_resources.file_search &&
        assistant.tool_resources.file_search.vector_store_ids &&
        assistant.tool_resources.file_search.vector_store_ids.length > 0) {
      
      console.log(`El asistente tiene ${assistant.tool_resources.file_search.vector_store_ids.length} vector stores`);
      
      for (const vectorStoreId of assistant.tool_resources.file_search.vector_store_ids) {
        try {
          // Obtener los detalles del vector store usando Axios
          const vectorStoreResponse = await axios.get(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
              }
            }
          );
          
          const vectorStore = vectorStoreResponse.data;
          console.log(`Vector store ${vectorStoreId} recuperado: ${vectorStore.name}`);
          
          // Primero, obtener los archivos directamente del vector store
          if (vectorStore.file_ids && vectorStore.file_ids.length > 0) {
            console.log(`Vector store contiene ${vectorStore.file_ids.length} archivos: ${JSON.stringify(vectorStore.file_ids)}`);
            
            for (const fileId of vectorStore.file_ids) {
              try {
                const fileInfo = await openai.files.retrieve(fileId);
                console.log(`Archivo encontrado en vector store: ${fileInfo.filename} (ID: ${fileInfo.id})`);
                
                // Verificar si este archivo ya está en la lista (para evitar duplicados)
                if (!allFiles.some(f => f.id === fileInfo.id)) {
                  allFiles.push({
                    id: fileInfo.id,
                    filename: fileInfo.filename,
                    bytes: fileInfo.bytes,
                    created_at: fileInfo.created_at,
                    purpose: fileInfo.purpose,
                    source: 'vector_store',
                    vector_store_id: vectorStoreId
                  });
                }
              } catch (fileError) {
                console.error(`Error al obtener detalles del archivo ${fileId} del vector store:`, fileError);
              }
            }
          } else {
            console.log(`Vector store ${vectorStoreId} no tiene file_ids. Intentando obtener files del vector store...`);
            
            // Si el vector store no muestra file_ids, intentar obtener los archivos con una API adicional
            try {
              const vectorStoreFilesResponse = await axios.get(
                `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
                {
                  headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2'
                  }
                }
              );
              
              const vectorStoreFiles = vectorStoreFilesResponse.data;
              console.log(`Vector store files encontrados: ${JSON.stringify(vectorStoreFiles)}`);
              
              if (vectorStoreFiles.data && vectorStoreFiles.data.length > 0) {
                for (const vectorStoreFile of vectorStoreFiles.data) {
                  // Corregir error: extraer el ID correctamente de each vectorStoreFile
                  const fileId = vectorStoreFile.id;  // Este es el ID correcto (no vectorStoreFile.file_id)
                  
                  if (fileId) {
                    try {
                      console.log(`Obteniendo detalles del archivo con ID: ${fileId}`);
                      const fileInfo = await openai.files.retrieve(fileId);
                      console.log(`Archivo encontrado en listado de vector store: ${fileInfo.filename}`);
                      
                      if (!allFiles.some(f => f.id === fileInfo.id)) {
                        allFiles.push({
                          id: fileInfo.id,
                          filename: fileInfo.filename,
                          bytes: fileInfo.bytes,
                          created_at: fileInfo.created_at,
                          purpose: fileInfo.purpose,
                          source: 'vector_store',
                          vector_store_id: vectorStoreId
                        });
                      }
                    } catch (fileError) {
                      console.error(`Error al obtener detalles del archivo ${fileId}:`, fileError);
                    }
                  } else {
                    console.warn(`Advertencia: Archivo sin ID válido en el vector store: ${JSON.stringify(vectorStoreFile)}`);
                  }
                }
              }
            } catch (vectorStoreFilesError) {
              console.error(`Error al obtener los archivos del vector store ${vectorStoreId}:`, vectorStoreFilesError);
              
              // Si la API del vector store falla, intenta buscar los archivos directamente
              console.log("Intentando buscar archivos relacionados con este vector store...");
              try {
                const allFilesResponse = await axios.get(
                  'https://api.openai.com/v1/files?purpose=assistants',
                  {
                    headers: {
                      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                const filesData = allFilesResponse.data.data || [];
                // Asumimos que los archivos más recientes (últimos 5) podrían estar relacionados
                const recentFiles = filesData.slice(0, 5);
                
                for (const file of recentFiles) {
                  if (!allFiles.some(f => f.id === file.id)) {
                    console.log(`Añadiendo archivo reciente como posible relación: ${file.filename}`);
                    allFiles.push({
                      id: file.id,
                      filename: file.filename,
                      bytes: file.bytes,
                      created_at: file.created_at,
                      purpose: file.purpose,
                      source: 'vector_store_recent',
                      vector_store_id: vectorStoreId
                    });
                  }
                }
              } catch (listFilesError) {
                console.error('Error al listar archivos:', listFilesError);
              }
            }
          }
        } catch (vectorStoreError) {
          console.error(`Error al obtener el vector store ${vectorStoreId}:`, vectorStoreError);
        }
      }
    }

    console.log(`Total de archivos encontrados: ${allFiles.length}`);
    
    if (allFiles.length === 0) {
      console.log('No se encontraron archivos para este asistente');
      
      // Intento adicional: buscar archivos recientes
      console.log("Intentando buscar archivos recientes como último recurso...");
      try {
        const allFilesResponse = await axios.get(
          'https://api.openai.com/v1/files?purpose=assistants',
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const filesData = allFilesResponse.data.data || [];
        // Tomar los archivos más recientes (últimos 10)
        const recentFiles = filesData.slice(0, 10);
        
        for (const file of recentFiles) {
          console.log(`Archivo reciente encontrado: ${file.filename}`);
          allFiles.push({
            id: file.id,
            filename: file.filename,
            bytes: file.bytes,
            created_at: file.created_at,
            purpose: file.purpose,
            source: 'recent'
          });
        }
        
        console.log(`Total de archivos recientes encontrados: ${recentFiles.length}`);
      } catch (listFilesError) {
        console.error('Error al listar archivos recientes:', listFilesError);
      }
    }
    
    res.status(200).json({
      success: true,
      data: allFiles
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

    // Obtener el asistente para ver sus archivos y vector stores
    const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
    let fileFound = false;
    let vectorStoreToUpdate = null;

    // 1. Comprobar si el archivo está directamente asociado al asistente
    if (assistant.file_ids && assistant.file_ids.includes(fileId)) {
      fileFound = true;
      console.log(`Archivo ${fileId} encontrado directamente asociado al asistente`);
      
      // Eliminar el archivo del asistente
      const updatedFileIds = assistant.file_ids.filter(id => id !== fileId);
      await openai.beta.assistants.update(gpt.openaiId, {
        file_ids: updatedFileIds
      });
      console.log(`Archivo ${fileId} eliminado del asistente ${gpt.openaiId}`);
    }

    // 2. Comprobar si el archivo está en algún vector store asociado al asistente
    if (assistant.tool_resources && 
        assistant.tool_resources.file_search && 
        assistant.tool_resources.file_search.vector_store_ids && 
        assistant.tool_resources.file_search.vector_store_ids.length > 0) {
      
      for (const vectorStoreId of assistant.tool_resources.file_search.vector_store_ids) {
        try {
          // Obtener detalles del vector store
          const vectorStoreResponse = await axios.get(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
              }
            }
          );
          
          const vectorStore = vectorStoreResponse.data;
          
          // Verificar si el vector store contiene el archivo
          if (vectorStore.file_ids && vectorStore.file_ids.includes(fileId)) {
            fileFound = true;
            vectorStoreToUpdate = vectorStoreId;
            console.log(`Archivo ${fileId} encontrado en vector store ${vectorStoreId}`);
            break;
          }
          
          // Si no encontramos el archivo en los file_ids directos, buscar en los files del vector store
          const vectorStoreFilesResponse = await axios.get(
            `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
              }
            }
          );
          
          const filesData = vectorStoreFilesResponse.data;
          if (filesData.data && filesData.data.some(file => file.id === fileId)) {
            fileFound = true;
            vectorStoreToUpdate = vectorStoreId;
            console.log(`Archivo ${fileId} encontrado en los files del vector store ${vectorStoreId}`);
            break;
          }
        } catch (error) {
          console.error(`Error al verificar el vector store ${vectorStoreId}:`, error);
        }
      }
      
      // Si encontramos el archivo en un vector store, eliminarlo
      if (vectorStoreToUpdate) {
        try {
          console.log(`Eliminando archivo ${fileId} del vector store ${vectorStoreToUpdate}`);
          
          // Obtener la lista actual de archivos del vector store
          const vectorStoreFilesResponse = await axios.get(
            `https://api.openai.com/v1/vector_stores/${vectorStoreToUpdate}/files`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
              }
            }
          );
          
          const filesData = vectorStoreFilesResponse.data;
          
          // Si solo queda un archivo en el vector store (el que vamos a eliminar), eliminar todo el vector store
          if (filesData.data && filesData.data.length === 1 && filesData.data[0].id === fileId) {
            console.log(`El vector store ${vectorStoreToUpdate} solo contiene este archivo, eliminando el vector store completo`);
            
            // Eliminar el vector store
            await axios.delete(
              `https://api.openai.com/v1/vector_stores/${vectorStoreToUpdate}`,
              {
                headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                  'OpenAI-Beta': 'assistants=v2'
                }
              }
            );
            
            // Actualizar el asistente para eliminar la referencia al vector store
            const updatedVectorStoreIds = assistant.tool_resources.file_search.vector_store_ids.filter(
              id => id !== vectorStoreToUpdate
            );
            
            await openai.beta.assistants.update(gpt.openaiId, {
              tool_resources: {
                file_search: {
                  vector_store_ids: updatedVectorStoreIds
                }
              }
            });
            
            console.log(`Vector store ${vectorStoreToUpdate} eliminado del asistente`);
          } else {
            // Eliminar solo el archivo del vector store
            await axios.delete(
              `https://api.openai.com/v1/vector_stores/${vectorStoreToUpdate}/files/${fileId}`,
              {
                headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                  'OpenAI-Beta': 'assistants=v2'
                }
              }
            );
            
            console.log(`Archivo ${fileId} eliminado del vector store ${vectorStoreToUpdate}`);
          }
        } catch (error) {
          console.error(`Error al eliminar el archivo del vector store:`, error);
        }
      }
    }

    if (!fileFound) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado en el asistente ni en sus vector stores'
      });
    }

    // Intentar eliminar el archivo de OpenAI
    try {
      await openai.files.del(fileId);
      console.log(`Archivo ${fileId} eliminado de OpenAI`);
    } catch (deleteFileError) {
      console.error(`Error al eliminar el archivo ${fileId} de OpenAI:`, deleteFileError);
      // No fallamos si no se puede eliminar el archivo, ya que lo importante
      // es que se haya eliminado del asistente/vector store
    }

    res.status(200).json({
      success: true,
      message: `Archivo eliminado correctamente`
    });
  } catch (err) {
    console.error('Error al eliminar archivo del asistente:', err);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el archivo',
      details: err.message
    });
  }
};
