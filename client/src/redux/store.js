import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

import authReducer from './slices/authSlice';
import gptReducer from './slices/gptSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';

// Configuración mejorada para persistir datos de archivos con mejor cacheado
const gptPersistConfig = {
  key: 'gpts',
  storage,
  whitelist: ['files', 'currentGPT'], // Solo persistir datos de archivos y GPT actual
  blacklist: ['loading', 'error'], // No persistir estados efímeros
  // Configuraciones adicionales para mejorar persistencia
  stateReconciler: (inboundState, originalState, reducedState, config) => {
    // Proceso personalizado de reconciliación para archivos
    // Esto permite combinar el estado existente con el entrante para mejor persistencia
    if (inboundState.files && inboundState.files.userFiles) {
      // Combinar archivos existentes con los rehydratados
      const existingFiles = originalState.files?.userFiles || [];
      const incomingFiles = inboundState.files?.userFiles || [];
      
      // Usar mapa para evitar duplicados por ID
      const filesMap = {};
      
      // Añadir primero los archivos existentes
      existingFiles.forEach(file => {
        if (file && file.id) {
          filesMap[file.id] = { ...file, lastUpdated: Date.now() };
        }
      });
      
      // Añadir/sobrescribir con archivos entrantes 
      incomingFiles.forEach(file => {
        if (file && file.id) {
          // Si ya existe el archivo, preservar la marca de tiempo más reciente
          const existing = filesMap[file.id];
          if (existing) {
            filesMap[file.id] = {
              ...file,
              lastUpdated: Math.max(existing.lastUpdated || 0, file.lastUpdated || 0),
              // Asegurar que tenemos un gptId válido
              gptId: file.gptId || existing.gptId
            };
          } else {
            // Nuevo archivo del almacenamiento
            filesMap[file.id] = { ...file, rehydrated: true };
          }
        }
      });
      
      // Convertir de nuevo a array
      const combinedFiles = Object.values(filesMap);
      
      // Actualizar estado con los archivos combinados
      return {
        ...inboundState,
        files: {
          ...inboundState.files,
          userFiles: combinedFiles,
          // Aclarar que los datos fueron fusionados
          lastUpdate: Date.now(),
          metadata: {
            ...(inboundState.files.metadata || {}),
            rehydrated: true,
            combined_file_count: combinedFiles.length
          }
        }
      };
    }
    
    // Para otros estados, usar comportamiento predeterminado
    return inboundState;
  },
  serialize: true, // Asegurar serialización para almacenamiento
  timeout: 2000 // Aumentar timeout para grandes conjuntos de datos
};

// Aplicar persistencia específica al reducer de GPTs
const persistedGptReducer = persistReducer(gptPersistConfig, gptReducer);

// Configuración raíz para persistencia
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // La persistencia de GPTs se maneja por separado
  blacklist: ['ui'], // Nunca persistir estados de UI
  // Configuración adicional
  timeout: 2000, // Aumentar timeout para grandes conjuntos de datos
  throttle: 1000 // Limitar frecuencia de guardado
};

const rootReducer = combineReducers({
  auth: authReducer,
  gpts: persistedGptReducer, // Usar el reducer de GPT persistido
  ui: uiReducer,
  users: userReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Configuración más completa para serializableCheck
      serializableCheck: {
        ignoredActions: [
          FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
          // Acciones específicas de nuestra aplicación que pueden contener datos no serializables
          'gpts/uploadFiles',
          'gpts/uploadFiles/fulfilled',
          'gpts/updateFilesForGpt'
        ],
        // Ignorar ciertos paths donde podríamos tener datos no serializables
        ignoredActionPaths: ['meta.arg', 'payload.data.files'],
        ignoredPaths: ['gpts.files.pendingFiles'],
      },
      // Aumentar immutableCheck para permitir nuestras estructuras de datos
      immutableCheck: { warnAfter: 250 }
    }),
  // Aumentar límite de tamaño del estado para almacenar más archivos
  devTools: {
    stateSanitizer: (state) => {
      // Sanitizar estado para evitar problemas de tamaño en DevTools
      if (state.gpts && state.gpts.files && state.gpts.files.userFiles) {
        return {
          ...state,
          gpts: {
            ...state.gpts,
            files: {
              ...state.gpts.files,
              userFiles: `[${state.gpts.files.userFiles.length} archivos]` // Ocultar datos de archivos en DevTools
            }
          }
        };
      }
      return state;
    }
  }
});

// Configurar persistor con opciones adicionales
export const persistor = persistStore(store, {
  manualPersist: false, // Persistir automáticamente
  purge: false // No purgar al iniciar
});