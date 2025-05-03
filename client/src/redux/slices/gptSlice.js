import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/gpts';

const getConfig = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};
export const fetchGPTs = createAsyncThunk(
  'gpts/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(API_URL, getConfig(token));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAllGPTs = createAsyncThunk(
  'gpts/fetchAllAdmin',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(API_URL, getConfig(token));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAvailableGPTs = createAsyncThunk(
  'gpts/fetchAvailable',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/available`, getConfig(token));
      return response.data;
    } catch (error) {
      console.error('Error al obtener GPTs disponibles:', error);
      return rejectWithValue(error.response?.data || { error: 'Error al cargar GPTs disponibles' });
    }
  }
);

export const fetchGPT = createAsyncThunk(
  'gpts/fetchOne',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/${id}`, getConfig(token));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createGPT = createAsyncThunk(
  'gpts/create',
  async (gptData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(API_URL, gptData, getConfig(token));
      return response.data;
    } catch (error) {
      console.error('Error completo en createGPT:', error);
      return rejectWithValue(error.response?.data || { error: 'Error desconocido' });
    }
  }
);

export const updateGPT = createAsyncThunk(
  'gpts/update',
  async ({ id, gptData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.put(`${API_URL}/${id}`, gptData, getConfig(token));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteGPT = createAsyncThunk(
  'gpts/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      await axios.delete(`${API_URL}/${id}`, getConfig(token));
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createThread = createAsyncThunk(
  'gpts/createThread',
  async (gptId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      if (gptId) {
        const response = await axios.post(
          `${API_URL}/${gptId}/threads`,
          {},
          getConfig(token)
        );
        return response.data;
      } else {

        const response = await axios.post(
          `${API_URL}/threads`,
          {},
          getConfig(token)
        );
        return response.data;
      }
    } catch (error) {
      console.error('Error al crear thread:', error);
      return rejectWithValue(error.response?.data || { error: 'Error al crear el thread' });
    }
  }
);

export const getThreadMessages = createAsyncThunk(
  'gpts/getThreadMessages',
  async (threadId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(`${API_URL}/threads/${threadId}/messages`, getConfig(token));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Error al obtener los mensajes' });
    }
  }
);

export const sendMessageToAssistant = createAsyncThunk(
  'gpts/sendMessageToAssistant',
  async ({ gptId, threadId, message, files = [] }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(
        `${API_URL}/${gptId}/threads/${threadId}/messages`,
        { message, files },
        getConfig(token)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Error al enviar el mensaje' });
    }
  }
);

export const chatWithGPT = createAsyncThunk(
  'gpts/chat',
  async ({ id, message, files }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.post(
        `${API_URL}/${id}/chat`,
        { message, files },
        getConfig(token)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const resetGPTMemory = createAsyncThunk(
  'gpts/resetMemory',
  async (gptId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.delete(
        `${API_URL}/${gptId}/threads`,
        getConfig(token)
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Error al resetear la memoria' });
    }
  }
);

export const uploadAssistantFiles = createAsyncThunk(
  'gpts/uploadFiles',
  async ({ gptId, files }, { getState, rejectWithValue }) => {
    try {
      if (!gptId) {
        return rejectWithValue({
          error: 'ID de GPT no proporcionado',
          code: 'MISSING_GPT_ID'
        });
      }
      
      if (!files || files.length === 0) {
        return rejectWithValue({
          error: 'No se han proporcionado archivos para subir',
          code: 'NO_FILES_PROVIDED'
        });
      }
      
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({
          error: 'No hay token de autenticación disponible',
          code: 'AUTH_ERROR'
        });
      }

      // Validar cada archivo antes de enviarlo
      const validFiles = [];
      const invalidFiles = [];
      
      for (const file of files) {
        if (!file.name || !file.data) {
          invalidFiles.push({
            name: file.name || 'Archivo sin nombre',
            error: 'Datos de archivo incompletos'
          });
          continue;
        }
        
        // Añadir a lista de archivos válidos
        validFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: file.data
        });
      }
      
      // Si no hay archivos válidos, rechazar
      if (validFiles.length === 0) {
        return rejectWithValue({
          error: 'Ningún archivo cumple con los requisitos para ser subido',
          invalidFiles,
          code: 'INVALID_FILES'
        });
      }

      console.log(`[Redux] Subiendo ${validFiles.length} archivos al GPT ${gptId}`);
      
      // Implementar timeout para manejar posibles problemas de red
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al subir archivos')), 60000)
      );
      
      // Crear promesa de solicitud HTTP
      const requestPromise = axios.post(
        `${API_URL}/${gptId}/files`,
        { files: validFiles },
        getConfig(token)
      );
      
      // Usar Race para manejar timeout
      const response = await Promise.race([requestPromise, timeoutPromise]);
      
      console.log(`[Redux] Respuesta de subida de archivos:`, response.data);
      return response.data;
    } catch (error) {
      console.error('[Redux] Error al subir archivos:', error);
      
      // Extraer y formatear información de error para mejor diagnóstico
      const errorInfo = {
        error: error.message || 'Error al subir archivos',
        code: error.code || 'UNKNOWN_ERROR',
        status: error.response?.status,
        data: error.response?.data
      };
      
      return rejectWithValue(errorInfo);
    }
  }
);

export const getAssistantUserFiles = createAsyncThunk(
  'gpts/getFiles',
  async (gptId, { getState, rejectWithValue }) => {
    try {
      if (!gptId) {
        return rejectWithValue({
          error: 'ID de GPT no proporcionado',
          code: 'MISSING_GPT_ID'
        });
      }
      
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({
          error: 'No hay token de autenticación disponible',
          code: 'AUTH_ERROR'
        });
      }
      
      console.log(`[Redux] Solicitando archivos para GPT ${gptId}`);
      
      // Implementar timeout para manejar posibles problemas de red
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al obtener archivos')), 30000)
      );
      
      // Crear promesa de solicitud HTTP
      const requestPromise = axios.get(
        `${API_URL}/${gptId}/files`,
        getConfig(token)
      );
      
      // Usar Race para manejar timeout
      const response = await Promise.race([requestPromise, timeoutPromise]);
      
      if (!response.data) {
        return rejectWithValue({
          error: 'Respuesta vacía del servidor',
          code: 'EMPTY_RESPONSE'
        });
      }
      
      // Validar estructura de datos esperada
      if (!response.data.data && !Array.isArray(response.data.data)) {
        console.warn('[Redux] Estructura de datos inesperada en respuesta de archivos:', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('[Redux] Error al obtener archivos:', error);
      
      // Extraer información detallada del error
      let errorInfo = {
        error: error.message || 'Error al obtener archivos',
        code: error.code || 'UNKNOWN_ERROR',
        status: error.response?.status,
        timestamp: new Date().toISOString()
      };
      
      // Agregar detalles específicos del error si están disponibles
      if (error.response?.data) {
        errorInfo = { ...errorInfo, details: error.response.data };
      }
      
      return rejectWithValue(errorInfo);
    }
  }
);

export const deleteAssistantFile = createAsyncThunk(
  'gpts/deleteFile',
  async ({ gptId, fileId }, { getState, rejectWithValue }) => {
    try {
      // Validar parámetros obligatorios
      if (!gptId) {
        return rejectWithValue({
          error: 'ID de GPT no proporcionado',
          code: 'MISSING_GPT_ID'
        });
      }
      
      if (!fileId) {
        return rejectWithValue({
          error: 'ID de archivo no proporcionado',
          code: 'MISSING_FILE_ID'
        });
      }
      
      const token = getState().auth.token;
      if (!token) {
        return rejectWithValue({
          error: 'No hay token de autenticación disponible',
          code: 'AUTH_ERROR'
        });
      }
      
      console.log(`[Redux] Eliminando archivo ${fileId} del GPT ${gptId}`);
      
      // Implementar timeout para manejar posibles problemas de red
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al eliminar archivo')), 20000)
      );
      
      // Crear promesa de solicitud HTTP
      const requestPromise = axios.delete(
        `${API_URL}/${gptId}/files/${fileId}`,
        getConfig(token)
      );
      
      // Usar Race para manejar timeout
      const response = await Promise.race([requestPromise, timeoutPromise]);
      
      if (!response.data) {
        return rejectWithValue({
          error: 'Respuesta vacía del servidor al eliminar archivo',
          code: 'EMPTY_RESPONSE'
        });
      }
      
      console.log('[Redux] Archivo eliminado con éxito:', response.data);
      
      // Devolver respuesta enriquecida con el ID del archivo para actualizar el estado local
      return { 
        ...response.data, 
        fileId,
        timestamp: Date.now() 
      };
    } catch (error) {
      console.error('[Redux] Error al eliminar archivo:', error);
      
      // Extraer información detallada del error para mejor diagnóstico
      const errorInfo = {
        error: error.message || 'Error al eliminar archivo',
        code: error.code || 'UNKNOWN_ERROR',
        status: error.response?.status,
        fileId: fileId, // Incluir el ID del archivo para identificación
        timestamp: new Date().toISOString()
      };
      
      // Añadir detalles específicos del error si están disponibles
      if (error.response?.data) {
        errorInfo.details = error.response.data;
      }
      
      return rejectWithValue(errorInfo);
    }
  }
);

const initialState = {
  gpts: [],
  availableGPTs: [],
  currentGPT: null,
  chat: {
    threadId: null,
    messages: [],
    response: null,
    loading: false,
    error: null
  },
  files: {
    userFiles: [],
    loading: false,
    error: null,
    uploadSuccess: false,
    lastUpdate: null,
    metadata: null,
    // Nuevos campos para mejorar el tracking
    pendingFiles: [], // Archivos en proceso de carga o procesamiento
    fileStatuses: {}, // Mapa de ID de archivo a estado
    lastError: null,  // Último error específico de archivos
    stats: {
      totalUploaded: 0,
      totalErrors: 0,
      lastSuccessfulUpload: null
    }
  },
  loading: false,
  error: null
};

const gptSlice = createSlice({
  name: 'gpts',
  initialState,
  reducers: {
    clearGPTError: (state) => {
      state.error = null;
      state.files.error = null;
      state.files.lastError = null;
    },
    clearChatResponse: (state) => {
      state.chat.response = null;
      state.chat.error = null;
    },
    clearChatState: (state) => {
      state.chat = initialState.chat;
    },
    clearUploadSuccess: (state) => {
      state.files.uploadSuccess = false;
    },
    // Nuevos reducers para tracking de archivos
    updateFileStatus: (state, action) => {
      const { fileId, status, metadata } = action.payload;
      if (fileId) {
        state.files.fileStatuses[fileId] = {
          status,
          updatedAt: Date.now(),
          ...metadata
        };
      }
    },
    // Actualización optimista de la lista de archivos (para vista previa)
    updateFilesList: (state, action) => {
      // Reemplazar la lista de archivos con la proporcionada por el componente
      state.files.userFiles = action.payload;
      
      // Registrar último tiempo de actualización para la UI
      state.files.lastUpdate = Date.now();
      
      console.log('[Redux] Lista de archivos actualizada manualmente con', state.files.userFiles.length, 'archivos');
    },
    
    // Actualizar solo timestamp para mantener frescura del caché sin modificar datos
    updateCacheTimestamp: (state, action) => {
      state.files.lastUpdate = action.payload;
      console.log('[Redux] Timestamp de caché actualizado:', new Date(action.payload).toISOString());
    },
    
    // Actualizar archivos para un GPT específico sin modificar otros archivos
    updateFilesForGpt: (state, action) => {
      const { files, gptId } = action.payload;
      
      if (!files || !gptId) return;
      
      // Filtrar los archivos actuales para mantener solo los que no son del GPT actual
      const existingFiles = state.files.userFiles || [];
      const otherGptFiles = existingFiles.filter(file => file.gptId && file.gptId !== gptId);
      
      // Combinar con los nuevos archivos para este GPT
      state.files.userFiles = [...files, ...otherGptFiles];
      
      // Actualizar timestamp
      state.files.lastUpdate = Date.now();
      
      console.log(`[Redux] Actualización específica para GPT ${gptId}: ${files.length} archivos`);
    },
    clearPendingFiles: (state) => {
      state.files.pendingFiles = [];
    },
    markFileProcessingComplete: (state, action) => {
      const { fileId } = action.payload;
      
      // Actualizar estado del archivo
      if (fileId && state.files.fileStatuses[fileId]) {
        state.files.fileStatuses[fileId].status = 'ready';
        state.files.fileStatuses[fileId].updatedAt = Date.now();
      }
      
      // Eliminar de archivos pendientes si existe
      state.files.pendingFiles = state.files.pendingFiles.filter(id => id !== fileId);
      
      // Actualizar estadísticas
      state.files.stats.totalProcessed = (state.files.stats.totalProcessed || 0) + 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGPTs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGPTs.fulfilled, (state, action) => {
        state.loading = false;
        state.gpts = action.payload.data;
      })
      .addCase(fetchGPTs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al cargar GPTs';
      })
      .addCase(fetchAllGPTs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllGPTs.fulfilled, (state, action) => {
        state.loading = false;
        state.gpts = action.payload.data;
      })
      .addCase(fetchAllGPTs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al cargar todos los GPTs';
      })
      .addCase(fetchAvailableGPTs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableGPTs.fulfilled, (state, action) => {
        state.loading = false;
        state.availableGPTs = action.payload.data;
      })
      .addCase(fetchAvailableGPTs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al cargar GPTs disponibles de OpenAI';
      })
      .addCase(fetchGPT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGPT.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGPT = action.payload.data;
      })
      .addCase(fetchGPT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al cargar GPT';
      })
      .addCase(createGPT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGPT.fulfilled, (state, action) => {
        state.loading = false;
        state.gpts = [...state.gpts, action.payload.data];
        state.currentGPT = action.payload.data;
      })
      .addCase(createGPT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear GPT';
      })
      .addCase(updateGPT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGPT.fulfilled, (state, action) => {
        state.loading = false;
        state.gpts = state.gpts.map(gpt =>
          gpt._id === action.payload.data._id ? action.payload.data : gpt
        );
        if (state.currentGPT && state.currentGPT._id === action.payload.data._id) {
          state.currentGPT = action.payload.data;
        }
      })
      .addCase(updateGPT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar GPT';
      })
      .addCase(deleteGPT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGPT.fulfilled, (state, action) => {
        state.loading = false;
        state.gpts = state.gpts.filter(gpt => gpt._id !== action.payload);
        if (state.currentGPT && state.currentGPT._id === action.payload) {
          state.currentGPT = null;
        }
      })
      .addCase(deleteGPT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar GPT';
      })
      .addCase(chatWithGPT.pending, (state) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(chatWithGPT.fulfilled, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.response = action.payload.data;
      })
      .addCase(chatWithGPT.rejected, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error en la comunicación con el GPT';
      })
      .addCase(createThread.pending, (state) => {
        // Ensure chat property exists before setting loading
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(createThread.fulfilled, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.threadId = action.payload.data.id;
      })
      .addCase(createThread.rejected, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error al crear el thread';
      })
      .addCase(getThreadMessages.pending, (state) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(getThreadMessages.fulfilled, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.messages = action.payload.data;
      })
      .addCase(getThreadMessages.rejected, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error al obtener los mensajes';
      })
      .addCase(sendMessageToAssistant.pending, (state) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(sendMessageToAssistant.fulfilled, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.messages = action.payload.data;
      })
      .addCase(sendMessageToAssistant.rejected, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error al enviar el mensaje';
      })
      .addCase(resetGPTMemory.pending, (state) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(resetGPTMemory.fulfilled, (state) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.threadId = null;
        state.chat.messages = [];
      })
      .addCase(resetGPTMemory.rejected, (state, action) => {
        // Ensure chat property exists
        if (!state.chat) {
          state.chat = { ...initialState.chat };
        }
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error al resetear la memoria';
      })
      .addCase(uploadAssistantFiles.pending, (state) => {
        state.files.loading = true;
        state.files.error = null;
        state.files.lastError = null;
        state.files.uploadSuccess = false;
      })
      .addCase(uploadAssistantFiles.fulfilled, (state, action) => {
        state.files.loading = false;
        
        // Guardar la respuesta completa en uploadSuccess para mostrar información detallada
        state.files.uploadSuccess = action.payload;

        const uploadTimestamp = Date.now();
        const gptId = action.meta.arg?.gptId; // Obtener el ID del GPT
        
        console.log(`[Redux] Respuesta de carga recibida para GPT ${gptId}`);
        
        // Priorizar los archivos actuales si están disponibles en la respuesta
        if (action.payload.data?.current_files && action.payload.data.current_files.length > 0) {
          console.log(`[Redux] Usando lista de archivos actual desde el servidor (${action.payload.data.current_files.length} archivos)`);
          
          const currentFiles = action.payload.data.current_files.map(file => ({
            ...file,
            status: 'ready', // Los archivos ya están listos 
            source: file.source || 'assistant',
            last_verified: uploadTimestamp,
            gptId: gptId, // Asegurar que el archivo está asociado con el GPT correcto
            uploaded_by_app: file.uploaded_by_app || file.filename?.startsWith('user_') || false
          }));
          
          // Usar directamente los archivos actuales (más confiable)
          const existingFiles = state.files.userFiles || [];
          const otherGptFiles = existingFiles.filter(file => file.gptId && file.gptId !== gptId);
          
          // Combinar archivos actuales con los de otros GPTs
          state.files.userFiles = [...currentFiles, ...otherGptFiles];
          
          // Limpiar pendientes para este GPT
          state.files.pendingFiles = state.files.pendingFiles.filter(pendingId => {
            const fileStatus = state.files.fileStatuses[pendingId];
            return !(fileStatus && fileStatus.gptId === gptId);
          });
          
          // Actualizar estadísticas
          state.files.stats.totalUploaded += action.payload.data.uploaded?.length || 0;
          state.files.stats.lastSuccessfulUpload = uploadTimestamp;
          
          // Actualizar timestamp
          state.files.lastUpdate = uploadTimestamp;
        } 
        // Fallback a la lógica original si no hay lista actual
        else if (action.payload.data?.uploaded && action.payload.data.uploaded.length > 0) {
          console.log(`[Redux] Usando lista de archivos subidos (${action.payload.data.uploaded.length})`);
          const newFiles = action.payload.data.uploaded.map(file => {
            // Crear objeto de archivo con información completa
            const fileObj = {
              id: file.openai_id,
              filename: file.name.startsWith('user_') ? file.name.substring(5) : file.name,
              originalName: file.originalName,
              type: file.type,
              size: file.size,
              status: 'processing', // Marcar como procesando inicialmente
              source: 'pending', // Fuente aún no determinada
              uploaded_at: uploadTimestamp,
              uploaded_by_app: true,
              gptId: gptId
            };
            
            // Registrar en el mapa de estados de archivos
            state.files.fileStatuses[file.openai_id] = {
              status: 'processing',
              filename: fileObj.filename,
              size: file.size,
              upload_timestamp: uploadTimestamp,
              last_check: uploadTimestamp,
              gptId: gptId
            };
            
            // Agregar a la lista de archivos pendientes para seguimiento
            state.files.pendingFiles.push(file.openai_id);
            
            return fileObj;
          });

          // Añadir nuevos archivos a la lista existente (preservando los de otros GPTs)
          const existingFiles = state.files.userFiles || [];
          const otherGptFiles = existingFiles.filter(file => file.gptId && file.gptId !== gptId);
          
          state.files.userFiles = [...newFiles, ...otherGptFiles];
          
          // Actualizar estadísticas
          state.files.stats.totalUploaded += newFiles.length;
          state.files.stats.lastSuccessfulUpload = uploadTimestamp;
          
          // Registrar tiempo de última actualización
          state.files.lastUpdate = uploadTimestamp;
        }
        
        // Registrar errores si los hay
        if (action.payload.data?.errors && action.payload.data.errors.length > 0) {
          state.files.lastError = {
            type: 'partial_upload_failure',
            count: action.payload.data.errors.length,
            details: action.payload.data.errors,
            timestamp: Date.now()
          };
          
          // Actualizar estadísticas
          state.files.stats.totalErrors += action.payload.data.errors.length;
        }
      })
      .addCase(uploadAssistantFiles.rejected, (state, action) => {
        state.files.loading = false;
        
        // Guardar información detallada del error
        state.files.error = action.payload?.error || 'Error al subir archivos';
        
        // Guardar información extendida del error
        state.files.lastError = {
          type: 'upload_failure',
          message: action.payload?.error || 'Error desconocido',
          code: action.payload?.code || 'UNKNOWN_ERROR',
          details: action.payload?.details || null,
          timestamp: Date.now()
        };
        
        // Actualizar estadísticas
        state.files.stats.totalErrors += 1;
      })
      .addCase(getAssistantUserFiles.pending, (state) => {
        state.files.loading = true;
        state.files.error = null;
      })
      .addCase(getAssistantUserFiles.fulfilled, (state, action) => {
        state.files.loading = false;
        
        // Asegurarnos de que tenemos datos válidos
        if (action.payload && action.payload.data) {
          const fetchTimestamp = Date.now();
          const receivedFiles = action.payload.data;
          const gptId = action.meta.arg; // Obtener GPT ID del argumento de la acción
          
          console.log(`[Redux] Recibidos ${receivedFiles.length} archivos para GPT ${gptId}`);
          
          // Construir mapa de archivos recibidos para operaciones más eficientes
          const receivedFilesMap = {};
          receivedFiles.forEach(file => {
            receivedFilesMap[file.id] = true;
            
            // Actualizar estado del archivo
            state.files.fileStatuses[file.id] = {
              status: file.status || 'ready',
              filename: file.filename,
              size: file.bytes,
              source: file.source || 'unknown',
              last_check: fetchTimestamp,
              uploaded_by_app: file.uploaded_by_app || false,
              gptId: gptId // Asociar con el GPT específico
            };
          });
          
          // Verificar si algún archivo pendiente ya está listo
          if (state.files.pendingFiles.length > 0) {
            // Para cada archivo pendiente, verificar si está en la respuesta
            const stillPendingFiles = state.files.pendingFiles.filter(pendingId => {
              // Si el archivo está en la respuesta, ya no está pendiente
              if (receivedFilesMap[pendingId]) {
                // Actualizar estado del archivo
                if (state.files.fileStatuses[pendingId]) {
                  state.files.fileStatuses[pendingId].status = 'ready';
                  state.files.fileStatuses[pendingId].last_check = fetchTimestamp;
                }
                return false; // Eliminar de pendientes
              }
              return true; // Mantener como pendiente
            });
            
            // Actualizar lista de archivos pendientes
            state.files.pendingFiles = stillPendingFiles;
          }
          
          // Actualizar la lista de archivos con información adicional y preservar los existentes para otros GPTs
          const existingFiles = state.files.userFiles || [];
          const otherGptFiles = existingFiles.filter(file => file.gptId && file.gptId !== gptId);
          
          // Generar lista actualizada de archivos para el GPT actual
          const updatedGptFiles = receivedFiles.map(file => ({
            ...file,
            // Añadir información de tracking si existe
            status: state.files.fileStatuses[file.id]?.status || file.status || 'ready',
            tracked: !!state.files.fileStatuses[file.id],
            last_verified: fetchTimestamp,
            gptId: gptId // CLAVE: Asociar cada archivo con su GPT para facilitar filtrado/persistencia
          }));
          
          // Combinar los archivos actualizados con los archivos de otros GPTs
          state.files.userFiles = [...updatedGptFiles, ...otherGptFiles];
          
          console.log('[Redux] Actualización híbrida: mantenidos', otherGptFiles.length, 
            'archivos de otros GPTs + agregados', updatedGptFiles.length, 
            'archivos del GPT actual. Total:', state.files.userFiles.length);
          
          // Guardar también la metadata para referencia
          state.files.metadata = action.payload.meta || null;
          
          // Registrar el momento de la última actualización
          state.files.lastUpdate = fetchTimestamp;
          
          // Limpiar errores anteriores
          state.files.error = null;
          
          console.log(`[Redux] Actualizada lista de archivos: ${receivedFiles.length} archivos, ${state.files.pendingFiles.length} pendientes`);
        } else {
          console.error('[Redux] Datos de archivos inválidos recibidos:', action.payload);
          state.files.error = 'No se pudieron cargar los archivos (datos inválidos)';
          
          // Guardar información detallada del error
          state.files.lastError = {
            type: 'invalid_data',
            message: 'Datos de archivos inválidos recibidos',
            timestamp: Date.now(),
            payload: action.payload
          };
        }
      })
      .addCase(getAssistantUserFiles.rejected, (state, action) => {
        state.files.loading = false;
        
        // Guardar información básica del error
        state.files.error = action.payload?.error || 'Error al obtener archivos';
        
        // Guardar información detallada del error
        state.files.lastError = {
          type: 'fetch_failure',
          message: action.payload?.error || 'Error desconocido',
          code: action.payload?.code || 'UNKNOWN_ERROR',
          details: action.payload?.details || null,
          timestamp: Date.now()
        };
        
        // Incrementar estadísticas de error
        state.files.stats.totalErrors += 1;
      })
      .addCase(deleteAssistantFile.pending, (state, action) => {
        state.files.loading = true;
        state.files.error = null;
        
        // Marcar el archivo como "deleting" en el tracking si tenemos el fileId
        const { fileId } = action.meta?.arg || {};
        if (fileId && state.files.fileStatuses[fileId]) {
          state.files.fileStatuses[fileId].status = 'deleting';
          state.files.fileStatuses[fileId].last_check = Date.now();
        }
      })
      .addCase(deleteAssistantFile.fulfilled, (state, action) => {
        state.files.loading = false;
        const deleteTimestamp = Date.now();
        const fileId = action.payload.fileId;
        
        // Eliminar archivo de la lista visible
        if (state.files.userFiles) {
          state.files.userFiles = state.files.userFiles.filter(
            file => file.id !== fileId
          );
        }
        
        // Eliminar de archivos pendientes si estaba ahí
        if (state.files.pendingFiles.includes(fileId)) {
          state.files.pendingFiles = state.files.pendingFiles.filter(id => id !== fileId);
        }
        
        // Actualizar mapa de estados de archivos
        if (state.files.fileStatuses[fileId]) {
          // Guardar información temporal para estadísticas
          const wasUploadedByApp = state.files.fileStatuses[fileId].uploaded_by_app;
          const fileName = state.files.fileStatuses[fileId].filename;
          
          // Eliminar del mapa después de capturar la información
          delete state.files.fileStatuses[fileId];
          
          // Actualizar estadísticas
          if (wasUploadedByApp) {
            state.files.stats.totalDeleted = (state.files.stats.totalDeleted || 0) + 1;
          }
          
          console.log(`[Redux] Eliminado archivo ${fileName} (${fileId})`);
        }
        
        // Actualizar timestamp
        state.files.lastUpdate = deleteTimestamp;
      })
      .addCase(deleteAssistantFile.rejected, (state, action) => {
        state.files.loading = false;
        
        // Guardar información básica del error
        state.files.error = action.payload?.error || 'Error al eliminar archivo';
        
        // Obtener información del archivo que se intentó eliminar
        const fileId = action.meta?.arg?.fileId;
        
        // Restaurar estado del archivo si tenemos su ID
        if (fileId && state.files.fileStatuses[fileId]) {
          // Marcar como 'error' en vez de 'deleting'
          state.files.fileStatuses[fileId].status = 'error';
          state.files.fileStatuses[fileId].error = action.payload?.error || 'Error al eliminar';
          state.files.fileStatuses[fileId].last_check = Date.now();
        }
        
        // Guardar información detallada del error
        state.files.lastError = {
          type: 'delete_failure',
          message: action.payload?.error || 'Error desconocido',
          code: action.payload?.code || 'UNKNOWN_ERROR',
          fileId: fileId,
          details: action.payload?.details || null,
          timestamp: Date.now()
        };
        
        // Incrementar estadísticas de error
        state.files.stats.totalErrors += 1;
      });
  }
});

export const { 
  clearGPTError, 
  clearChatResponse, 
  clearChatState, 
  clearUploadSuccess,
  // Nuevas acciones para tracking de archivos
  updateFileStatus,
  updateFilesList,
  updateCacheTimestamp,
  updateFilesForGpt,
  clearPendingFiles,
  markFileProcessingComplete
} = gptSlice.actions;

export default gptSlice.reducer;