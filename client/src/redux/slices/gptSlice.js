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

// Nuevas acciones para la gestión de archivos
export const uploadAssistantFiles = createAsyncThunk(
  'gpts/uploadFiles',
  async ({ gptId, files }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      const formattedFiles = files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        data: file.data
      }));

      const response = await axios.post(
        `${API_URL}/${gptId}/files`,
        { files: formattedFiles },
        getConfig(token)
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Error al subir archivos' });
    }
  }
);

export const getAssistantUserFiles = createAsyncThunk(
  'gpts/getFiles',
  async (gptId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.get(
        `${API_URL}/${gptId}/files`,
        getConfig(token)
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Error al obtener archivos' });
    }
  }
);

export const deleteAssistantFile = createAsyncThunk(
  'gpts/deleteFile',
  async ({ gptId, fileId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const response = await axios.delete(
        `${API_URL}/${gptId}/files/${fileId}`,
        getConfig(token)
      );

      return { ...response.data, fileId };
    } catch (error) {
      return rejectWithValue(error.response?.data || { error: 'Error al eliminar archivo' });
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
    uploadSuccess: false
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all GPTs
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

      // Fetch all GPTs for admin
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

      // Fetch available GPTs from OpenAI
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

      // Fetch single GPT
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

      // Create GPT
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

      // Update GPT
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

      // Delete GPT
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

      // Chat with GPT (mantener para compatibilidad)
      .addCase(chatWithGPT.pending, (state) => {
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(chatWithGPT.fulfilled, (state, action) => {
        state.chat.loading = false;
        state.chat.response = action.payload.data;
      })
      .addCase(chatWithGPT.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error en la comunicación con el GPT';
      })

      // Nuevos reducers para los threads
      // Create Thread
      .addCase(createThread.pending, (state) => {
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.chat.loading = false;
        state.chat.threadId = action.payload.data.id;
      })
      .addCase(createThread.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error al crear el thread';
      })

      // Get Thread Messages
      .addCase(getThreadMessages.pending, (state) => {
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(getThreadMessages.fulfilled, (state, action) => {
        state.chat.loading = false;
        state.chat.messages = action.payload.data;
      })
      .addCase(getThreadMessages.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error al obtener los mensajes';
      })

      // Send Message to Assistant
      .addCase(sendMessageToAssistant.pending, (state) => {
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(sendMessageToAssistant.fulfilled, (state, action) => {
        state.chat.loading = false;
        state.chat.messages = action.payload.data;
      })
      .addCase(sendMessageToAssistant.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error al enviar el mensaje';
      })

      // Reset memory
      .addCase(resetGPTMemory.pending, (state) => {
        state.chat.loading = true;
        state.chat.error = null;
      })
      .addCase(resetGPTMemory.fulfilled, (state) => {
        state.chat.loading = false;
        state.chat.threadId = null;
        state.chat.messages = [];
      })
      .addCase(resetGPTMemory.rejected, (state, action) => {
        state.chat.loading = false;
        state.chat.error = action.payload?.error || 'Error al resetear la memoria';
      })

      .addCase(uploadAssistantFiles.pending, (state) => {
        state.files.loading = true;
        state.files.error = null;
        state.files.uploadSuccess = false;
      })
      .addCase(uploadAssistantFiles.fulfilled, (state, action) => {
        state.files.loading = false;
        state.files.uploadSuccess = true;
        
        // Si hay archivos subidos con éxito, los añadimos a la lista
        if (action.payload.data.uploaded && action.payload.data.uploaded.length > 0) {
          // Si userFiles ya existe, mantener los archivos existentes y añadir los nuevos
          const newFiles = action.payload.data.uploaded.map(file => ({
            id: file.openai_id,
            filename: file.name,
            originalName: file.originalName,
            type: file.type,
            size: file.size
          }));
          
          state.files.userFiles = [...(state.files.userFiles || []), ...newFiles];
        }
      })
      .addCase(uploadAssistantFiles.rejected, (state, action) => {
        state.files.loading = false;
        state.files.error = action.payload?.error || 'Error al subir archivos';
      })
      
      // Get Assistant User Files
      .addCase(getAssistantUserFiles.pending, (state) => {
        state.files.loading = true;
        state.files.error = null;
      })
      .addCase(getAssistantUserFiles.fulfilled, (state, action) => {
        state.files.loading = false;
        state.files.userFiles = action.payload.data;
      })
      .addCase(getAssistantUserFiles.rejected, (state, action) => {
        state.files.loading = false;
        state.files.error = action.payload?.error || 'Error al obtener archivos';
      })
      
      // Delete Assistant File
      .addCase(deleteAssistantFile.pending, (state) => {
        state.files.loading = true;
        state.files.error = null;
      })
      .addCase(deleteAssistantFile.fulfilled, (state, action) => {
        state.files.loading = false;
        
        // Eliminar el archivo de la lista
        if (state.files.userFiles) {
          state.files.userFiles = state.files.userFiles.filter(
            file => file.id !== action.payload.fileId
          );
        }
      })
      .addCase(deleteAssistantFile.rejected, (state, action) => {
        state.files.loading = false;
        state.files.error = action.payload?.error || 'Error al eliminar archivo';
      });
  }
});

export const { clearGPTError, clearChatResponse, clearChatState, clearUploadSuccess } = gptSlice.actions;
export default gptSlice.reducer;