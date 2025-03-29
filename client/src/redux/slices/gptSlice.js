import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/gpts';

// Configuración de encabezados con token
const getConfig = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Thunks para acciones asíncronas
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
      // Usar el mismo endpoint - para admin ya muestra todos los GPTs
      const response = await axios.get(API_URL, getConfig(token));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
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
      return rejectWithValue(error.response.data);
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

const initialState = {
  gpts: [],
  currentGPT: null,
  chat: {
    response: null,
    loading: false,
    error: null
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
      // Chat with GPT
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
      });
  }
});

export const { clearGPTError, clearChatResponse } = gptSlice.actions;
export default gptSlice.reducer;