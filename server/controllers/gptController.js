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

    for (const file of files) {
      let tempFilePath;
      try {
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

        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const userPrefixedName = `user_${file.name}`;

        tempFilePath = path.join(uploadDir, userPrefixedName);
        fs.writeFileSync(tempFilePath, fileData);

        const uploadedFile = await openai.files.create({
          file: fs.createReadStream(tempFilePath),
          purpose: 'assistants'
        });

        fileIds.push(uploadedFile.id);

        fs.unlinkSync(tempFilePath);

        uploadedFiles.push({
          name: userPrefixedName,
          originalName: file.name,
          openai_id: uploadedFile.id,
          type: file.type,
          size: file.size
        });
      } catch (fileError) {
        console.error(`Error procesando archivo ${file.name}:`, fileError);

        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (unlinkError) {
            console.error('Error al eliminar archivo temporal:', unlinkError);
          }
        }

        errorFiles.push({
          name: file.name,
          error: fileError.message
        });
      }
    }

    if (fileIds.length > 0) {
      try {

        const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);

        let existingVectorStoreId = null;

        if (assistant.tool_resources &&
          assistant.tool_resources.file_search &&
          assistant.tool_resources.file_search.vector_store_ids &&
          assistant.tool_resources.file_search.vector_store_ids.length > 0) {

          existingVectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];

          for (const fileId of fileIds) {
            try {
              await axios.post(
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
            } catch (error) {
              console.error(`Error al añadir el archivo ${fileId} al vector store:`, error);

              throw new Error('No se pudo añadir el archivo al vector store existente');
            }
          }

        } else {

          const safeGptName = gpt.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
          const vectorStoreName = `app_${safeGptName}_${Date.now()}`;

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

          await new Promise(resolve => setTimeout(resolve, 2000));

          let tools = assistant.tools || [];
          if (!tools.some(tool => tool.type === 'file_search')) {
            tools.push({ type: 'file_search' });
          }

          await openai.beta.assistants.update(gpt.openaiId, {
            tools: tools,
            tool_resources: {
              file_search: {
                vector_store_ids: [vectorStore.id]
              }
            }
          });

        }
      } catch (vectorStoreError) {
        console.error('Error al gestionar el vector store:', vectorStoreError);

        try {
          const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);

          let currentFileIds = assistant.file_ids || [];

          const updatedFileIds = [...currentFileIds, ...fileIds];

          await openai.beta.assistants.update(gpt.openaiId, {
            file_ids: updatedFileIds
          });

        } catch (fallbackError) {
          console.error('Error también en el método alternativo:', fallbackError);
        }
      }
    }

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
        error: 'No tienes permiso para ver este GPT'
      });
    }

    const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
    const allFiles = [];

    if (assistant.tool_resources &&
      assistant.tool_resources.file_search &&
      assistant.tool_resources.file_search.vector_store_ids &&
      assistant.tool_resources.file_search.vector_store_ids.length > 0) {

      const vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];

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

        const filesData = vectorStoreFilesResponse.data;

        if (filesData.data && filesData.data.length > 0) {

          for (const file of filesData.data) {
            try {
              const fileInfo = await openai.files.retrieve(file.id);

              if (fileInfo.filename.startsWith('user_')) {
                allFiles.push({
                  id: fileInfo.id,
                  filename: fileInfo.filename.substring(5),
                  original_filename: fileInfo.filename,
                  bytes: fileInfo.bytes,
                  created_at: fileInfo.created_at,
                  purpose: fileInfo.purpose,
                  source: 'vector_store',
                  vector_store_id: vectorStoreId
                });
              }
            } catch (fileError) {
              console.error(`Error al obtener detalles del archivo ${file.id}:`, fileError);
            }
          }
        } else {
          console.log('No se encontraron archivos en el vector store');
        }
      } catch (vectorStoreError) {
        console.error(`Error al obtener archivos del vector store ${vectorStoreId}:`, vectorStoreError);
      }
    } else {
      if (assistant.file_ids && assistant.file_ids.length > 0) {
        for (const fileId of assistant.file_ids) {
          try {
            const fileInfo = await openai.files.retrieve(fileId);

            if (fileInfo.filename.startsWith('user_')) {
              allFiles.push({
                id: fileInfo.id,
                filename: fileInfo.filename.substring(5),
                original_filename: fileInfo.filename,
                bytes: fileInfo.bytes,
                created_at: fileInfo.created_at,
                purpose: fileInfo.purpose,
                source: 'direct'
              });
            }
          } catch (fileError) {
            console.error(`Error al obtener detalles del archivo ${fileId}:`, fileError);
          }
        }
      } else {
        console.log('El asistente no tiene archivos directamente asociados');
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

    let fileInfo;
    try {
      fileInfo = await openai.files.retrieve(fileId);

      if (!fileInfo.filename.startsWith('user_')) {
        return res.status(403).json({
          success: false,
          error: 'No se permite eliminar archivos que no fueron subidos desde esta aplicación'
        });
      }
    } catch (fileError) {
      console.error(`Error al obtener información del archivo ${fileId}:`, fileError);
      return res.status(404).json({
        success: false,
        error: 'No se puede encontrar el archivo solicitado'
      });
    }

    const assistant = await openai.beta.assistants.retrieve(gpt.openaiId);
    let fileFound = false;
    let vectorStoreToUpdate = null;

    if (assistant.tool_resources &&
      assistant.tool_resources.file_search &&
      assistant.tool_resources.file_search.vector_store_ids &&
      assistant.tool_resources.file_search.vector_store_ids.length > 0) {

      for (const vectorStoreId of assistant.tool_resources.file_search.vector_store_ids) {
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

          const filesData = vectorStoreFilesResponse.data;
          if (filesData.data && filesData.data.some(file => file.id === fileId)) {
            fileFound = true;
            vectorStoreToUpdate = vectorStoreId;
            break;
          }
        } catch (error) {
          console.error(`Error al verificar el vector store ${vectorStoreId}:`, error);
        }
      }

      if (vectorStoreToUpdate) {
        try {
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

          if (filesData.data && filesData.data.length === 1 && filesData.data[0].id === fileId) {

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
          } else {

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
          }
        } catch (error) {
          console.error(`Error al eliminar el archivo del vector store:`, error);
          return res.status(500).json({
            success: false,
            error: 'Error al eliminar el archivo del vector store',
            details: error.message
          });
        }
      }
    }

    if (!fileFound && assistant.file_ids && assistant.file_ids.includes(fileId)) {
      fileFound = true;

      const updatedFileIds = assistant.file_ids.filter(id => id !== fileId);

      await openai.beta.assistants.update(gpt.openaiId, {
        file_ids: updatedFileIds
      });
    }

    if (!fileFound) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado en el asistente'
      });
    }

    try {
      await openai.files.del(fileId);
    } catch (deleteFileError) {
      console.error(`Error al eliminar el archivo ${fileId} de OpenAI:`, deleteFileError);
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