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

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message || "Por favor analiza el contenido proporcionado"
    });

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: gpt.openaiId
    });

    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 60;

    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;

      if (attempts % 5 === 0) {
        console.log(`Esperando... Estado: ${runStatus.status}, intentos: ${attempts}/${maxAttempts}`);
      }
    }

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

exports.uploadAssistantFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { files } = req.body;

    const gpt = await GPT.findById(id);
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

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se han proporcionado archivos'
      });
    }

    const uploadedFiles = [];
    const errorFiles = [];
    const fileIds = [];

    // Función para eliminar archivo temporal con manejo mejorado de errores
    const cleanupTempFile = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          return true;
        } catch (unlinkError) {
          console.error('Error al eliminar archivo temporal:', unlinkError);
          return false;
        }
      }
      return true;
    };

    // Procesar cada archivo
    for (const file of files) {
      let tempFilePath;
      try {
        // Validación de archivo
        if (!file.data) {
          errorFiles.push({
            name: file.name,
            error: 'Datos de archivo no válidos'
          });
          continue;
        }

        const fileData = Buffer.from(file.data, 'base64');

        if (fileData.length === 0) {
          errorFiles.push({
            name: file.name,
            error: 'Buffer vacío después de convertir base64'
          });
          continue;
        }

        // Asegurar que el directorio de carga existe
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Crear nombre prefijado para rastrear archivos subidos por la aplicación
        const userPrefixedName = `user_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Escribir archivo temporal
        tempFilePath = path.join(uploadDir, userPrefixedName);
        fs.writeFileSync(tempFilePath, fileData);

        // Intentar subir archivo a OpenAI con reintentos
        let uploadedFile;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            uploadedFile = await openai.files.create({
              file: fs.createReadStream(tempFilePath),
              purpose: 'assistants'
            });
            break; // Si tiene éxito, salir del bucle
          } catch (uploadError) {
            retryCount++;
            console.error(`Intento ${retryCount}/${maxRetries} - Error subiendo archivo:`, uploadError.message);
            
            if (retryCount >= maxRetries) {
              throw new Error(`Falló después de ${maxRetries} intentos: ${uploadError.message}`);
            }
            
            // Esperar antes de reintentar (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
        }

        // Almacenar ID del archivo
        fileIds.push(uploadedFile.id);
        
        // Limpiar archivo temporal
        cleanupTempFile(tempFilePath);
        tempFilePath = null;

        // Registrar archivo subido exitosamente
        uploadedFiles.push({
          name: userPrefixedName,
          originalName: file.name,
          openai_id: uploadedFile.id,
          type: file.type,
          size: file.size
        });
      } catch (fileError) {
        console.error(`Error procesando archivo ${file.name}:`, fileError);
        cleanupTempFile(tempFilePath);

        errorFiles.push({
          name: file.name,
          error: fileError.message
        });
      }
    }

    // Procesar archivos subidos correctamente
    if (fileIds.length > 0) {
      try {
        // Obtener datos del asistente
        const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
        
        // Comprobar si ya existe un vector store
        let existingVectorStoreId = null;
        let vectorStoreCreated = false;

        if (assistant.tool_resources &&
          assistant.tool_resources.file_search &&
          assistant.tool_resources.file_search.vector_store_ids &&
          assistant.tool_resources.file_search.vector_store_ids.length > 0) {

          existingVectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];
          
          // Verificar que el vector store existe antes de intentar usarlo
          try {
            const vectorStoreCheck = await axios.get(
              `https://api.openai.com/v1/vector_stores/${existingVectorStoreId}`,
              {
                headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                  'OpenAI-Beta': 'assistants=v2'
                }
              }
            );
            
            if (!vectorStoreCheck.data || !vectorStoreCheck.data.id) {
              // Vector store no válido, crear uno nuevo
              throw new Error('Vector store no válido o inaccesible');
            }
            
            // Añadir archivos al vector store existente
            const failedFileIds = [];
            
            for (const fileId of fileIds) {
              let addSuccess = false;
              let addRetryCount = 0;
              const maxAddRetries = 3;
              
              while (!addSuccess && addRetryCount < maxAddRetries) {
                try {
                  const response = await axios.post(
                    `https://api.openai.com/v1/vector_stores/${existingVectorStoreId}/files`,
                    {
                      file_id: fileId
                    },
                    {
                      headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                        'OpenAI-Beta': 'assistants=v2'
                      }
                    }
                  );
                  
                  // Verificar respuesta válida
                  if (response.status >= 200 && response.status < 300) {
                    addSuccess = true;
                  } else {
                    throw new Error(`Respuesta no válida: ${response.status}`);
                  }
                } catch (addError) {
                  addRetryCount++;
                  console.error(`Intento ${addRetryCount}/${maxAddRetries} - Error añadiendo archivo ${fileId} al vector store:`, addError.message);
                  
                  if (addRetryCount >= maxAddRetries) {
                    failedFileIds.push(fileId);
                    break;
                  }
                  
                  // Esperar antes de reintentar
                  await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, addRetryCount)));
                }
              }
            }
            
            // Si hay archivos que no se pudieron añadir, lanzar error
            if (failedFileIds.length > 0) {
              throw new Error(`No se pudieron añadir ${failedFileIds.length} archivos al vector store`);
            }
            
          } catch (vectorStoreError) {
            console.error('Error con el vector store existente:', vectorStoreError.message);
            // Seguiremos adelante y crearemos uno nuevo
            existingVectorStoreId = null;
          }
        }

        // Si no hay vector store existente o no se pudo validar, usar directamente los archivos adjuntos
        if (!existingVectorStoreId) {
          console.log('No se encontró vector store válido. Conectando archivos directamente al asistente.');
          
          try {
            // Obtener asistente actual y sus archivos
            const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
            let currentFileIds = assistant.file_ids || [];
            
            // Añadir los nuevos archivos
            const updatedFileIds = [...currentFileIds, ...fileIds];
            
            // Actualizar el asistente con los nuevos archivos directamente
            // Esto evita el uso de vector stores que parecen estar fallando
            await openai.beta.assistants.update(gpt.openaiId, {
              file_ids: updatedFileIds
            });
            
            console.log(`Archivos conectados directamente al asistente (${fileIds.length} archivos)`);
            vectorStoreCreated = false;
            
            // Preparar herramientas para file_search si no existen ya
            if (!assistant.tools || !assistant.tools.some(tool => tool.type === 'file_search')) {
              let tools = assistant.tools || [];
              if (!tools.some(tool => tool.type === 'file_search')) {
                tools.push({ type: 'file_search' });
                
                // Actualizar el asistente para añadir la herramienta de búsqueda de archivos
                await openai.beta.assistants.update(gpt.openaiId, {
                  tools: tools
                });
                console.log('Añadida herramienta de búsqueda de archivos (file_search) al asistente');
              }
            }
            
            // No usamos return aquí para permitir que la función avance hasta el final
            // y retorne la respuesta HTTP correcta
          } catch (directAttachError) {
            console.error('Error al adjuntar archivos directamente:', directAttachError.message);
            throw new Error('No se pudieron adjuntar archivos directamente: ' + directAttachError.message);
          }
        }
          
        // Ahora vamos a intentar crear un vector store si no existe uno válido
        if (!existingVectorStoreId && !vectorStoreCreated) {
          console.log('Intentando crear un nuevo vector store para el asistente...');
          
          try {
            // Primero, crear el vector store
            const createVectorStoreResponse = await axios.post(
              'https://api.openai.com/v1/vector_stores',
              {
                name: `vector_store_${gpt.openaiId}_${Date.now()}`,
                expires_after: '30d',  // 30 días de expiración (ajustar según necesidades)
              },
              {
                headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                  'OpenAI-Beta': 'assistants=v2'
                }
              }
            );
            
            if (createVectorStoreResponse.data && createVectorStoreResponse.data.id) {
              const newVectorStoreId = createVectorStoreResponse.data.id;
              console.log(`Vector store creado con éxito: ${newVectorStoreId}`);
              
              // Segundo, añadir archivos al vector store
              for (const fileId of fileIds) {
                try {
                  await axios.post(
                    `https://api.openai.com/v1/vector_stores/${newVectorStoreId}/files`,
                    {
                      file_id: fileId
                    },
                    {
                      headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                        'OpenAI-Beta': 'assistants=v2'
                      }
                    }
                  );
                  console.log(`Archivo ${fileId} añadido al vector store ${newVectorStoreId}`);
                } catch (addFileError) {
                  console.error(`Error al añadir archivo ${fileId} al vector store:`, addFileError.message);
                  // Continuamos con el siguiente archivo
                }
              }
              
              // Tercero, configurar herramientas para el asistente
              let tools = assistant.tools || [];
              if (!tools.some(tool => tool.type === 'file_search')) {
                tools.push({ type: 'file_search' });
              }
              
              // Cuarto, actualizar el asistente con el vector store
              await openai.beta.assistants.update(gpt.openaiId, {
                tools: tools,
                tool_resources: {
                  file_search: {
                    vector_store_ids: [newVectorStoreId]
                  }
                }
              });
              
              console.log(`Asistente actualizado correctamente con vector store ${newVectorStoreId}`);
              vectorStoreCreated = true;
            }
          } catch (createVectorStoreError) {
            console.error('Error al crear vector store:', createVectorStoreError.message);
            // No es fatal, ya hemos adjuntado los archivos directamente
          }
        }
      } catch (vectorStoreError) {
        console.error('Error al gestionar el vector store:', vectorStoreError.message);

        // Método alternativo: añadir archivos directamente al asistente
        try {
          console.log('Usando método principal: añadir archivos directamente al asistente');
          const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
          let currentFileIds = assistant.file_ids || [];
          const updatedFileIds = [...currentFileIds, ...fileIds];
          
          await openai.beta.assistants.update(gpt.openaiId, {
            file_ids: updatedFileIds
          });
          
          // Asegurarnos de que el asistente tenga la herramienta de búsqueda de archivos (file_search)
          let tools = assistant.tools || [];
          if (!tools.some(tool => tool.type === 'file_search')) {
            tools.push({ type: 'file_search' });
            
            // Actualizar el asistente para añadir la herramienta de búsqueda de archivos
            await openai.beta.assistants.update(gpt.openaiId, {
              tools: tools
            });
            console.log('Añadida herramienta de búsqueda de archivos (file_search) al asistente');
          }
          
          console.log('Archivos adjuntados exitosamente al asistente');
          
        } catch (fallbackError) {
          console.error('Error en el adjuntado de archivos:', fallbackError.message);
          
          // Añadir información de error para la respuesta
          errorFiles.push({
            name: 'file_attachment_error',
            error: 'No se pudieron vincular los archivos al asistente: ' + fallbackError.message
          });
        }
      }
    }

    try {
      // Obtener la lista de archivos actualizados para incluirlos en la respuesta
      const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
      const assistantFiles = assistant.file_ids || [];
      
      console.log(`Verificando archivos adjuntos al asistente. Encontrados: ${assistantFiles.length}`);
      
      // Recuperar detalles de los archivos
      const fileDetails = [];
      for (const fileId of assistantFiles) {
        try {
          const fileInfo = await openai.files.retrieve(fileId);
          fileDetails.push({
            id: fileInfo.id,
            filename: fileInfo.filename.startsWith('user_') ? fileInfo.filename.substring(5) : fileInfo.filename,
            original_filename: fileInfo.filename,
            bytes: fileInfo.bytes,
            created_at: fileInfo.created_at,
            purpose: fileInfo.purpose,
            source: 'assistant',
            status: 'active',
            uploaded_by_app: fileInfo.filename.startsWith('user_')
          });
        } catch (err) {
          console.error(`Error al obtener detalles del archivo ${fileId}:`, err.message);
        }
      }
      
      // Devolver respuesta con información detallada incluyendo los archivos actuales
      res.status(200).json({
        success: true,
        data: {
          uploaded: uploadedFiles,
          errors: errorFiles,
          message: errorFiles.length > 0 
            ? `Se subieron ${uploadedFiles.length} archivos con ${errorFiles.length} errores`
            : `Se subieron ${uploadedFiles.length} archivos correctamente`,
          current_files: fileDetails // Incluir archivos actuales para mostrar inmediatamente
        }
      });
    } catch (finalError) {
      console.error('Error al obtener archivos actualizados:', finalError);
      
      // Devolver respuesta sin los archivos actuales
      res.status(200).json({
        success: true,
        data: {
          uploaded: uploadedFiles,
          errors: errorFiles,
          message: errorFiles.length > 0 
            ? `Se subieron ${uploadedFiles.length} archivos con ${errorFiles.length} errores`
            : `Se subieron ${uploadedFiles.length} archivos correctamente`,
          current_files: [] // Lista vacía en caso de error
        }
      });
    }
  } catch (err) {
    console.error('Error al subir archivos al asistente:', err);
    res.status(500).json({
      success: false,
      error: 'Error al procesar los archivos',
      details: err.message,
      code: err.code || 'UNKNOWN_ERROR'
    });
  }
};

exports.getAssistantUserFiles = async (req, res) => {
  try {
    console.log('========== INICIO OBTENCIÓN DE ARCHIVOS ==========');
    const { id } = req.params;
    console.log(`Solicitando archivos para GPT ID: ${id}`);

    const gpt = await GPT.findById(id);
    if (!gpt) {
      console.log(`ERROR: GPT con ID ${id} no encontrado`);
      return res.status(404).json({
        success: false,
        error: 'GPT no encontrado'
      });
    }
    console.log(`GPT encontrado: ${gpt.name}, OpenAI ID: ${gpt.openaiId}`);

    if (
      req.user.role !== 'admin' &&
      !gpt.isPublic &&
      gpt.createdBy.toString() !== req.user.id &&
      !gpt.allowedUsers.includes(req.user.id)
    ) {
      console.log(`ERROR: Usuario ${req.user.id} no tiene permiso para ver este GPT`);
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para ver este GPT'
      });
    }

    // Obtener datos del asistente con reintentos para mayor fiabilidad
    console.log('Obteniendo información del asistente desde OpenAI...');
    let assistant;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
        console.log(`Asistente obtenido correctamente: ${assistant.id}`);
        break;
      } catch (retrieveError) {
        retryCount++;
        console.error(`Intento ${retryCount}/${maxRetries} - Error obteniendo asistente:`, retrieveError.message);
        
        if (retryCount >= maxRetries) {
          throw new Error(`No se pudo obtener información del asistente después de ${maxRetries} intentos`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }

    const allFiles = [];
    const errors = [];
    let retrievalToolEnabled = false;

    // Verificar si la herramienta de búsqueda de archivos está habilitada
    if (assistant.tools && assistant.tools.some(tool => tool.type === 'file_search')) {
      retrievalToolEnabled = true;
      console.log('La herramienta de búsqueda de archivos (file_search) está habilitada en el asistente');
    } else {
      console.log('ADVERTENCIA: La herramienta de búsqueda de archivos (file_search) NO está habilitada en el asistente');
    }

    // Verificar los archivos adjuntos al asistente (método principal y más confiable)
    if (assistant.file_ids && assistant.file_ids.length > 0) {
      console.log(`Encontrados ${assistant.file_ids.length} archivos adjuntos al asistente ${gpt.openaiId}:`);
      console.log('IDs de archivos:', assistant.file_ids);
      
      // Procesar secuencialmente para mayor fiabilidad
      for (const fileId of assistant.file_ids) {
        try {
          console.log(`Obteniendo información del archivo ${fileId}...`);
          const fileInfo = await openai.files.retrieve(fileId);
          console.log(`Archivo encontrado: ${fileInfo.filename}, tamaño: ${fileInfo.bytes} bytes`);
          
          // Incluir tanto archivos subidos por esta aplicación como otros archivos
          // pero diferenciarlos por el prefijo
          const isAppFile = fileInfo.filename.startsWith('user_');
          console.log(`¿Archivo subido desde la aplicación? ${isAppFile ? 'SÍ' : 'NO'}`);
          
          const fileData = {
            id: fileInfo.id,
            filename: isAppFile ? fileInfo.filename.substring(5) : fileInfo.filename,
            original_filename: fileInfo.filename,
            bytes: fileInfo.bytes,
            created_at: fileInfo.created_at,
            purpose: fileInfo.purpose,
            source: 'assistant',
            status: 'active',
            uploaded_by_app: isAppFile
          };
          
          console.log('Añadiendo archivo a la lista con datos:', fileData);
          allFiles.push(fileData);
        } catch (fileError) {
          console.error(`Error al obtener detalles del archivo ${fileId}:`, fileError.message);
          errors.push({
            id: fileId,
            error: fileError.message,
            type: 'assistant_file_error'
          });
        }
      }
    } else {
      console.log('No se encontraron archivos directamente en el asistente');
    }
    
    // Ordenar archivos por fecha de creación (más recientes primero)
    allFiles.sort((a, b) => {
      return (b.created_at || 0) - (a.created_at || 0);
    });

    console.log(`Procesamiento completado. Se encontraron ${allFiles.length} archivos disponibles.`);
    console.log('Lista final de archivos:', JSON.stringify(allFiles, null, 2));
    
    if (errors.length > 0) {
      console.log(`Se encontraron ${errors.length} errores durante el proceso:`);
      console.log(JSON.stringify(errors, null, 2));
    }

    // Respuesta con información detallada
    const response = {
      success: true,
      data: allFiles,
      meta: {
        assistant_id: gpt.openaiId,
        retrieval_enabled: retrievalToolEnabled,
        file_count: allFiles.length,
        errors: errors.length > 0 ? errors : null
      }
    };
    
    console.log('Enviando respuesta al cliente...');
    console.log('========== FIN OBTENCIÓN DE ARCHIVOS ==========');
    
    res.status(200).json(response);
  } catch (err) {
    console.error('Error al obtener archivos del asistente:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los archivos',
      details: err.message,
      code: err.code || 'UNKNOWN_ERROR'
    });
  }
};

exports.deleteAssistantFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;

    const gpt = await GPT.findById(id);
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
        error: 'No tienes permiso para modificar este GPT'
      });
    }

    // Obtener información del asistente
    let assistant;
    try {
      assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
    } catch (error) {
      console.error('Error al obtener asistente:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener información del asistente',
        details: error.message
      });
    }

    // Verificar si el archivo está asociado al asistente
    if (!assistant.file_ids || !assistant.file_ids.includes(fileId)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado en el asistente'
      });
    }

    let operationResults = {
      file_removed_from_assistant: false,
      file_deleted_from_openai: false
    };

    // Primero, eliminar el archivo de la lista de archivos del asistente
    try {
      // Quitar el archivo de la lista
      const updatedFileIds = assistant.file_ids.filter(id => id !== fileId);
      
      // Actualizar el asistente sin el archivo
      await openai.beta.assistants.update(gpt.openaiId, {
        file_ids: updatedFileIds
      });
      
      console.log(`Archivo ${fileId} eliminado del asistente ${gpt.openaiId}`);
      operationResults.file_removed_from_assistant = true;
    } catch (error) {
      console.error('Error al eliminar archivo del asistente:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar archivo del asistente',
        details: error.message
      });
    }

    // Luego, intentar eliminar el archivo de OpenAI
    try {
      // Esperar un poco para asegurar que el archivo ya no está en uso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Intentar eliminar el archivo
      await openai.files.del(fileId);
      console.log(`Archivo ${fileId} eliminado de OpenAI`);
      operationResults.file_deleted_from_openai = true;
    } catch (error) {
      console.error('Error al eliminar archivo de OpenAI:', error.message);
      // Continuamos aunque haya error, ya que lo importante es que se haya eliminado del asistente
    }

    // Devolver respuesta con detalles de la operación
    return res.status(200).json({
      success: true,
      message: 'Archivo eliminado correctamente',
      details: operationResults
    });
  } catch (err) {
    console.error('Error al eliminar archivo:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar el archivo',
      details: err.message
    });
  }
};