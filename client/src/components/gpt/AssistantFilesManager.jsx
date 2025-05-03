import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  Divider,
  Alert,
  AlertTitle,
  Tooltip
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  CloudUpload as CloudUploadIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  uploadAssistantFiles, 
  getAssistantUserFiles, 
  deleteAssistantFile, 
  clearUploadSuccess, 
  clearGPTError,
  updateFilesList,
  updateFileStatus 
} from '../../redux/slices/gptSlice';

const AssistantFilesManager = ({ gptId, isEmbedded = false }) => {
  const dispatch = useDispatch();
  const { userFiles, loading, error, uploadSuccess } = useSelector(state => state.gpts.files);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  // Estados locales para el control de la UI
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastManualRefresh, setLastManualRefresh] = useState(0);
  
  // Obtener el último tiempo de actualización del estado global
  const lastUpdate = useSelector(state => state.gpts.files.lastUpdate);
  
  // Intervalo para actualización después de acciones manuales
  const refreshIntervals = useRef({
    afterAction: 3000 // 3 segundos después de una acción manual del usuario
  });
  const activityTimeout = useRef(null);

  // Función simplificada para registrar actividad del usuario (ahora solo para propósitos de log)
  const registerActivity = useCallback(() => {
    console.log('[AssistantFilesManager] Actividad del usuario registrada');
    // Ya no necesitamos gestionar estados de actividad ni timeouts
  }, []);
  
  // Flag para controlar si es la primera carga
  const initialLoadCompleted = useRef(false);
  
  // Referencia para mantener archivos en la memoria aunque el servidor devuelva una lista vacía
  const filesForThisGptRef = useRef([]);
  
  // Flag para indicar si ya hemos restaurado archivos desde la caché
  const hasRestoredFromCache = useRef(false);
  
  // Actualizar la referencia cuando cambian los archivos para este GPT
  useEffect(() => {
    if (!gptId || !userFiles) return;
    
    // Filtrar solo los archivos para este GPT
    const filesForThisGpt = userFiles.filter(file => file.gptId === gptId);
    
    // Si hay archivos para este GPT, actualizar nuestra referencia local
    if (filesForThisGpt.length > 0) {
      console.log(`[AssistantFilesManager] Actualizando caché local con ${filesForThisGpt.length} archivos para GPT ${gptId}`);
      filesForThisGptRef.current = filesForThisGpt;
    }
  }, [userFiles, gptId]);
  
  // Cargar archivos al montar el componente y cuando cambie el ID del GPT
  useEffect(() => {
    if (!gptId) return;
    
    console.log('[AssistantFilesManager] Cargando archivos iniciales para GPT:', gptId);
    
    // Solo verificar caché en la primera carga para evitar loops
    if (!initialLoadCompleted.current) {
      initialLoadCompleted.current = true;
      
      // Verificar si ya tenemos archivos en el store antes de solicitar
      if (userFiles && userFiles.length > 0) {
        console.log('[AssistantFilesManager] Usando archivos en caché:', userFiles.length);
        
        // Filtrar solo los archivos para este GPT
        const filesForThisGpt = userFiles.filter(file => file.gptId === gptId);
        filesForThisGptRef.current = filesForThisGpt;
        
        console.log(`[AssistantFilesManager] Archivos para GPT ${gptId}: ${filesForThisGpt.length}`);
        
        // Marcar que tenemos archivos en caché
        hasRestoredFromCache.current = filesForThisGpt.length > 0;
      }
    }
    
    // Obtener archivos del servidor independientemente de la caché
    setIsRefreshing(true);
    dispatch(getAssistantUserFiles(gptId))
      .then(result => {
        // Verificar si el servidor devolvió una lista vacía pero tenemos archivos en memoria
        if ((!result.payload?.data || result.payload.data.length === 0) && 
            filesForThisGptRef.current.length > 0) {
          console.log('[AssistantFilesManager] Servidor devolvió lista vacía, pero tenemos archivos en caché, restaurando...');
          
          // Restaurar los archivos desde nuestra memoria usando dispatch directo
          // para evitar modificar userFiles y causar otro rerender/bucle
          dispatch({
            type: 'gpts/updateFilesForGpt',
            payload: {
              files: filesForThisGptRef.current,
              gptId: gptId
            }
          });
          
          // Marcar que hemos restaurado desde caché
          hasRestoredFromCache.current = true;
        } else if (result.payload?.data && result.payload.data.length > 0) {
          // El servidor devolvió archivos, actualizar marca de caché
          hasRestoredFromCache.current = true;
          
          // También actualizar nuestra caché local
          filesForThisGptRef.current = result.payload.data.map(file => ({
            ...file,
            gptId: gptId // Asegurar que siempre tenemos el gptId correcto
          }));
        }
      })
      .finally(() => {
        setIsRefreshing(false);
      });
      
  // IMPORTANTE: Eliminar userFiles como dependencia para evitar bucle infinito
  }, [dispatch, gptId]);
  
  // Función para actualizar archivos con retardo exponencial en caso de error
  const refreshFilesWithBackoff = useCallback(async () => {
    if (!gptId || loading || isRefreshing) return false;
    
    // Limitación de frecuencia: no refrescar si la última actualización fue hace menos de 3 segundos
    const now = Date.now();
    if (lastUpdate && (now - lastUpdate < 3000)) {
      console.log('[AssistantFilesManager] Omitiendo actualización - demasiado frecuente');
      return false;
    }
    
    // Marcar como refrescando para evitar múltiples solicitudes
    setIsRefreshing(true);
    console.log('[AssistantFilesManager] Actualizando archivos con estrategia de backoff');
    
    // Guardar el estado actual de los archivos antes de actualizar
    const cachedFilesSnapshot = [...filesForThisGptRef.current];
    const cachedFilesCount = cachedFilesSnapshot.length;
    
    if (cachedFilesCount > 0) {
      console.log(`[AssistantFilesManager] Estado de caché antes de actualizar: ${cachedFilesCount} archivos guardados`);
    }
    
    let attempt = 0;
    const maxAttempts = 2; // Reducir a 2 para evitar demasiados reintentos
    let success = false;
    
    try {
      while (attempt < maxAttempts && !success) {
        try {
          const result = await dispatch(getAssistantUserFiles(gptId)).unwrap();
          
          // Verificar que la respuesta contiene datos válidos
          if (result && result.data && result.data.length > 0) {
            success = true;
            console.log(`[AssistantFilesManager] Archivos actualizados correctamente en intento ${attempt + 1}: ${result.data.length} archivos`);
            
            // Actualizar nuestra referencia local
            filesForThisGptRef.current = result.data.map(file => ({
              ...file,
              gptId: gptId
            }));
          } else {
            // El servidor devolvió una respuesta exitosa pero sin archivos
            console.warn(`[AssistantFilesManager] Servidor devolvió 0 archivos en intento ${attempt + 1}`);
            
            // Si tenemos archivos en caché y el servidor devuelve cero, restaurar nuestra caché
            if (cachedFilesCount > 0) {
              console.log(`[AssistantFilesManager] Restaurando ${cachedFilesCount} archivos desde caché local después de respuesta vacía`);
              
              // Usar la acción específica para no causar loops de actualización
              dispatch({
                type: 'gpts/updateFilesForGpt',
                payload: {
                  files: cachedFilesSnapshot,
                  gptId: gptId
                }
              });
              
              // Marcamos como éxito para no seguir reintentando
              success = true;
            } else {
              // Si no hay archivos en caché, tratamos como error para reintentar
              throw new Error('Servidor devolvió lista vacía sin explicación');
            }
          }
        } catch (error) {
          attempt++;
          console.warn(`[AssistantFilesManager] Error en intento ${attempt}/${maxAttempts}:`, error);
          
          if (attempt < maxAttempts) {
            // Esperar con backoff exponencial antes del siguiente intento
            const backoffTime = 1000 * Math.pow(2, attempt);
            console.log(`[AssistantFilesManager] Reintentando en ${backoffTime/1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else if (cachedFilesCount > 0) {
            // Si todos los intentos fallan pero tenemos archivos en caché, restaurar
            console.log(`[AssistantFilesManager] Todos los intentos fallaron. Restaurando ${cachedFilesCount} archivos desde caché local`);
            
            dispatch({
              type: 'gpts/updateFilesForGpt',
              payload: {
                files: cachedFilesSnapshot,
                gptId: gptId
              }
            });
            
            // No marcamos como éxito técnicamente, pero hemos recuperado lo que pudimos
          }
        }
      }
    } finally {
      // Siempre restablecer estado, incluso en caso de error inesperado
      setIsRefreshing(false);
    }
    
    return success;
  }, [dispatch, gptId, loading, isRefreshing, lastUpdate]);
  
  // Variables de control para acciones manuales
  const lastAutoRefreshRef = useRef(0);
  
  // Actualización SÓLO después de acciones manuales del usuario
  useEffect(() => {
    if (!gptId || !lastManualRefresh) return;
    
    // Verificar después de las acciones del usuario, pero con retardo para evitar bucles
    // Solo actualizar si ha pasado suficiente tiempo desde la última actualización
    const timer = setTimeout(() => {
      if (!isRefreshing && (Date.now() - lastUpdate > 5000)) {
        console.log('[AssistantFilesManager] Actualizando después de acción manual del usuario');
        refreshFilesWithBackoff();
      }
    }, refreshIntervals.current.afterAction);
    
    return () => clearTimeout(timer);
  }, [gptId, lastManualRefresh, isRefreshing, lastUpdate, refreshFilesWithBackoff]);

  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        dispatch(clearUploadSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess, dispatch]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await processFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (files) => {
    const validFiles = [];
    const errors = [];

    for (const file of files) {

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`Tipo de archivo no permitido: ${file.type}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`El archivo ${file.name} excede el tamaño máximo permitido (20MB)`);
        continue;
      }

      try {
        const base64Data = await readFileAsBase64(file);
        validFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data.split(',')[1]
        });
      } catch (error) {
        errors.push(`Error al leer el archivo ${file.name}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      // Mostrar errores con componente de UI consistente
      dispatch({
        type: 'ui/showAlert',
        payload: {
          message: `Algunos archivos no pudieron ser procesados (${errors.length})`,
          severity: 'warning',
          autoHideDuration: 5000,
          // Usar detalles adicionales para mostrar los errores específicos
          details: errors.join('\n')
        }
      });
      
      // También mostrar en consola para diagnóstico
      console.warn('[AssistantFilesManager] Errores de validación:', errors);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Estado adicional para controlar la carga de archivos independiente del estado global
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Registrar actividad del usuario
    registerActivity();
    
    // Iniciar la carga
    setIsUploading(true);
    console.log('[AssistantFilesManager] Iniciando carga de', selectedFiles.length, 'archivos');
    
    // Crear copia local de los archivos que se van a cargar para persistencia
    const filesToUpload = [...selectedFiles];
    
    try {
      // Crear objetos de archivo temporales para mostrarlos inmediatamente en la UI (actualización optimista)
      // Esto garantiza que los archivos sean visibles incluso antes de completar la subida
      const timestamp = Math.floor(Date.now() / 1000);
      const previewFiles = filesToUpload.map((file, index) => ({
        id: `temp_${timestamp}_${index}`, // ID temporal que se reemplazará por el real
        filename: file.name,
        bytes: file.size || 0,
        created_at: timestamp,
        status: 'uploading',         // Marcar como cargando
        uploaded_by_app: true,
        source: 'local_upload',      // Fuente local mientras se carga
        last_verified: Date.now(),
        gptId: gptId,                // Asociar con GPT correcto
        isPreliminary: true,         // Marcar como preliminar
        originalFile: file.name      // Mantener nombre original para matching
      }));
      
      console.log('[AssistantFilesManager] Aplicando vista optimista:', previewFiles.length, 'archivos');
      
      // Aplicar actualización optimista a la UI antes de la subida completa
      const currentFiles = userFiles || [];
      const updatedFiles = [...currentFiles, ...previewFiles];
      dispatch(updateFilesList(updatedFiles));
      
      // Actualizar nuestra referencia local
      filesForThisGptRef.current = [
        ...filesForThisGptRef.current.filter(f => f.gptId === gptId), 
        ...previewFiles
      ];
      
      // Iniciar la subida real
      const response = await dispatch(uploadAssistantFiles({
        gptId,
        files: filesToUpload
      })).unwrap();
      
      console.log('[AssistantFilesManager] Respuesta de subida de archivos:', response);
      
      // Limpiar la lista de archivos seleccionados
      setSelectedFiles([]);
      
      // Mostrar mensaje de éxito con detalles
      let successMessage = response.data?.message || 'Archivos subidos correctamente';
      if (response.data?.uploaded && response.data.uploaded.length > 0) {
        successMessage += ` (${response.data.uploaded.length} archivos)`;
      }
      
      dispatch({
        type: 'ui/showAlert',
        payload: {
          message: successMessage,
          severity: 'success',
          autoHideDuration: 3000
        }
      });
      
      // Mostrar resumen de errores si existen
      if (response.data && response.data.errors && response.data.errors.length > 0) {
        console.warn('[AssistantFilesManager] Algunos archivos tuvieron errores:', response.data.errors);
        
        // Mostrar advertencia si hay errores parciales
        if (response.data.uploaded && response.data.uploaded.length > 0) {
          dispatch({
            type: 'ui/showAlert',
            payload: {
              message: `Algunos archivos (${response.data.errors.length}) no pudieron ser procesados correctamente.`,
              severity: 'warning',
              autoHideDuration: 5000
            }
          });
        }
      }
      
      // Actualizar marcador de refresco manual
      setLastManualRefresh(Date.now());
      
      // Procesar la lista de archivos devuelta por el servidor
      if (response.data?.current_files && response.data.current_files.length > 0) {
        console.log('[AssistantFilesManager] Servidor devolvió lista de archivos actuales:', response.data.current_files.length);
        
        // Mantener información de todos los archivos, incluyendo los recién subidos
        const serverFiles = response.data.current_files.map(file => ({
          ...file,
          gptId: gptId,
          status: 'ready',               // Marcar como listos
          source: 'assistant',           // Fuente oficial
          last_verified: Date.now()
        }));
        
        // Buscar archivos temporales para reemplazarlos
        const currentFilesWithoutTemp = (userFiles || []).filter(file => 
          !file.isPreliminary && file.gptId === gptId
        );
        
        // Guardar los archivos de otros GPTs
        const otherGptFiles = (userFiles || []).filter(file => 
          file.gptId !== gptId
        );
        
        // Combinar archivos reales con otros GPTs
        const finalFilesList = [...serverFiles, ...otherGptFiles];
        
        // Actualizar el almacenamiento global
        dispatch(updateFilesList(finalFilesList));
        
        // Actualizar nuestra referencia local con los archivos confirmados
        filesForThisGptRef.current = serverFiles;
        
        console.log('[AssistantFilesManager] Estado de archivos actualizado con respuesta del servidor:', 
          serverFiles.length, 'archivos para este GPT,', 
          otherGptFiles.length, 'archivos de otros GPTs');
      } 
      // Si el servidor no devuelve la lista completa pero tenemos subidas correctas
      else if (response.data?.uploaded && response.data.uploaded.length > 0) {
        console.log('[AssistantFilesManager] Actualizando con archivos subidos:', response.data.uploaded.length);
        
        // Crear objetos de archivo reales para reemplazar los temporales
        const uploadedFiles = response.data.uploaded.map(file => ({
          id: file.openai_id,
          filename: file.originalName || file.name.replace(/^user_/, ''),
          bytes: file.size || 0,
          created_at: Math.floor(Date.now() / 1000),
          status: 'ready',
          uploaded_by_app: true,
          source: 'assistant',
          last_verified: Date.now(),
          gptId: gptId
        }));
        
        // Filtrar los archivos temporales que acaban de ser subidos
        const currentFilesWithoutNewTemp = (userFiles || []).filter(file => 
          !(file.isPreliminary && file.gptId === gptId && 
            response.data.uploaded.some(uf => 
              uf.originalName === file.originalFile || 
              uf.name.replace(/^user_/, '') === file.filename
            )
          )
        );
        
        // Combinar la lista filtrada con los archivos recién subidos
        const updatedFiles = [...currentFilesWithoutNewTemp, ...uploadedFiles];
        dispatch(updateFilesList(updatedFiles));
        
        // Actualizar nuestra referencia local
        filesForThisGptRef.current = [
          ...filesForThisGptRef.current.filter(f => !f.isPreliminary),
          ...uploadedFiles
        ];
        
        console.log('[AssistantFilesManager] Vista optimista actualizada con archivos reales:', uploadedFiles.length);
      }
      
      // Implementar estrategia de actualización gradual y persistente
      const refreshSchedule = [
        { delay: 2000, message: 'Primera actualización post-subida' },
        { delay: 7000, message: 'Segunda actualización post-subida' },
        { delay: 15000, message: 'Verificación final post-subida' },
        { delay: 30000, message: 'Última verificación de consistencia' },
      ];
      
      // Programar actualizaciones secuenciales con reintentos y protección de caché
      for (const refresh of refreshSchedule) {
        setTimeout(async () => {
          console.log(`[AssistantFilesManager] ${refresh.message}`);
          
          try {
            if (!isRefreshing) {
              // Crear snapshot de archivos actuales para posible restauración
              const filesSnapshot = [...filesForThisGptRef.current];
              const filesCount = filesSnapshot.filter(f => !f.isPreliminary).length;
              
              // Solo proceder si tenemos archivos reales para preservar
              if (filesCount > 0) {
                console.log(`[AssistantFilesManager] Backup antes de actualización: ${filesCount} archivos permanentes`);
              }
              
              // Ejecutar actualización con seguridad
              console.log(`[AssistantFilesManager] Forzando actualización de archivos...`);
              setIsRefreshing(true);
              
              try {
                const result = await dispatch(getAssistantUserFiles(gptId)).unwrap();
                
                // Verificar si el servidor devolvió archivos
                if (result && result.data && result.data.length > 0) {
                  console.log('[AssistantFilesManager] Actualización programada completada con éxito:', 
                    result.data.length, 'archivos recibidos');
                    
                  // Actualizar referencia local
                  filesForThisGptRef.current = result.data.map(file => ({
                    ...file,
                    gptId: gptId
                  }));
                } else if (filesCount > 0) {
                  // El servidor devolvió cero archivos pero teníamos archivos antes
                  console.warn('[AssistantFilesManager] ¡Servidor devolvió 0 archivos! Restaurando desde caché local');
                  
                  // Restaurar directamente usando nuestra acción específica
                  dispatch({
                    type: 'gpts/updateFilesForGpt',
                    payload: {
                      files: filesSnapshot.filter(f => !f.isPreliminary),
                      gptId: gptId
                    }
                  });
                }
              } catch (err) {
                console.error(`[AssistantFilesManager] Error en actualización programada:`, err);
                
                // Restaurar desde caché si teníamos archivos
                if (filesCount > 0) {
                  console.warn('[AssistantFilesManager] Restaurando copia de seguridad después de error');
                  
                  dispatch({
                    type: 'gpts/updateFilesForGpt',
                    payload: {
                      files: filesSnapshot.filter(f => !f.isPreliminary),
                      gptId: gptId
                    }
                  });
                }
              }
            }
          } finally {
            setIsRefreshing(false);
          }
        }, refresh.delay);
      }
    } catch (error) {
      console.error('[AssistantFilesManager] Error al subir archivos:', error);
      
      // Eliminar archivos preliminares que no se pudieron subir
      const currentFilesWithoutTemp = (userFiles || []).filter(file => !file.isPreliminary);
      dispatch(updateFilesList(currentFilesWithoutTemp));
      
      // Eliminar los archivos preliminares de nuestra referencia local
      filesForThisGptRef.current = filesForThisGptRef.current.filter(file => !file.isPreliminary);
      
      // Mostrar error al usuario con detalles mejorados
      const errorMessage = error.message || 'Error al subir archivos';
      const errorDetails = error.data?.details || '';
      
      dispatch({
        type: 'ui/showAlert',
        payload: {
          message: errorMessage + (errorDetails ? `: ${errorDetails}` : ''),
          severity: 'error',
          autoHideDuration: 6000
        }
      });
      
      // Intentar obtener la lista actualizada de archivos incluso si hubo errores
      setLastManualRefresh(Date.now());
      setTimeout(() => refreshFilesWithBackoff(), 3000);
    } finally {
      // Asegurarse de que el estado de carga se restablezca
      setIsUploading(false);
    }
  };


  const handleDeleteConfirm = (file) => {
    setConfirmDelete(file);
  };

  // Estado para controlar la eliminación de archivos
  const [isDeleting, setIsDeleting] = useState(false);
  
  const confirmDeleteFile = async () => {
    if (!confirmDelete || isDeleting) return;

    // Registrar actividad del usuario
    registerActivity();
    
    // Indicar visualmente que la eliminación está en progreso
    setIsDeleting(true);
    const fileBeingDeleted = confirmDelete;
    
    try {
      const response = await dispatch(deleteAssistantFile({
        gptId,
        fileId: confirmDelete.id
      })).unwrap();
      
      console.log('[AssistantFilesManager] Respuesta eliminación archivo:', response);
      
      // Mostrar mensaje según resultado
      if (response.success) {
        // Éxito total o parcial
        const severity = response.details && response.details.errors && response.details.errors.length > 0 
          ? 'warning' 
          : 'success';
          
        dispatch({
          type: 'ui/showAlert',
          payload: {
            message: response.message || 'Archivo eliminado',
            severity: severity,
            autoHideDuration: 3000
          }
        });
      } else {
        // Error en la eliminación
        dispatch({
          type: 'ui/showAlert',
          payload: {
            message: response.error || 'Error al eliminar archivo',
            severity: 'error',
            autoHideDuration: 5000
          }
        });
      }
      
      // Actualizar lista de archivos con backoff para asegurar consistencia
      setLastManualRefresh(Date.now());
      setTimeout(async () => {
        await refreshFilesWithBackoff();
      }, 1000);
      
    } catch (error) {
      console.error('[AssistantFilesManager] Error al eliminar archivo:', error);
      
      // Mostrar mensaje de error con detalles mejorados
      const errorMessage = error.message || 'Error al eliminar archivo';
      const errorDetails = error.data?.details || '';
      
      dispatch({
        type: 'ui/showAlert',
        payload: {
          message: errorMessage + (errorDetails ? `: ${errorDetails}` : ''),
          severity: 'error',
          autoHideDuration: 5000
        }
      });
      
      // Intentar refrescar la lista de archivos con backoff
      setLastManualRefresh(Date.now());
      setTimeout(async () => {
        await refreshFilesWithBackoff();
      }, 1500);
    } finally {
      // Restablecer estados
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleRemoveSelected = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Referencia para controlar la última actualización manual
  const lastManualRefreshTimeRef = useRef(0);
  
  const handleRefresh = async () => {
    // Evitar múltiples solicitudes o actualizaciones demasiado frecuentes
    const now = Date.now();
    if (isRefreshing) {
      console.log('[AssistantFilesManager] Ya hay una actualización en curso - solicitud ignorada');
      return;
    }
    
    // Limitar frecuencia de actualizaciones manuales (mínimo 3 segundos entre cada una)
    if (now - lastManualRefreshTimeRef.current < 3000) {
      console.log('[AssistantFilesManager] Actualización manual demasiado frecuente - solicitud ignorada');
      
      dispatch({
        type: 'ui/showAlert',
        payload: {
          message: 'Por favor, espere unos segundos antes de actualizar de nuevo',
          severity: 'warning',
          autoHideDuration: 2000
        }
      });
      
      return;
    }
    
    // Actualizar timestamp de referencia
    lastManualRefreshTimeRef.current = now;
    
    // Registrar actividad del usuario
    registerActivity();
    
    // Registrar tiempo de actualización manual
    setLastManualRefresh(now);
    
    // Notificar al usuario que estamos actualizando
    dispatch({
      type: 'ui/showAlert',
      payload: {
        message: 'Actualizando lista de archivos...',
        severity: 'info',
        autoHideDuration: 2000
      }
    });

    // Forzar actualización única con manejo seguro
    try {
      console.log('[AssistantFilesManager] Actualizando archivos manualmente');
      setIsRefreshing(true);
      
      // Guardar el estado actual de los archivos para una posible restauración
      const cachedFilesSnapshot = [...filesForThisGptRef.current];
      const cachedFilesCount = cachedFilesSnapshot.length;
      
      // Solicitud directa sin reintentos para actualizaciones manuales
      const response = await dispatch(getAssistantUserFiles(gptId)).unwrap();
      
      console.log('Lista de archivos actualizada manualmente con éxito');
      
      // Si no hay archivos, mostrar mensaje específico
      if (!response.data || response.data.length === 0) {
        // Si tenemos archivos en caché y el servidor devuelve cero, restaurar nuestra caché
        if (cachedFilesCount > 0) {
          console.log(`[AssistantFilesManager] Servidor devolvió lista vacía, pero tenemos ${cachedFilesCount} archivos en caché, restaurando...`);
          
          dispatch({
            type: 'gpts/updateFilesForGpt',
            payload: {
              files: cachedFilesSnapshot,
              gptId: gptId
            }
          });
          
          dispatch({
            type: 'ui/showAlert',
            payload: {
              message: `Se restauraron ${cachedFilesCount} archivos desde caché local`,
              severity: 'info',
              autoHideDuration: 3000
            }
          });
        } else {
          dispatch({
            type: 'ui/showAlert',
            payload: {
              message: 'No se encontraron archivos para este asistente',
              severity: 'info',
              autoHideDuration: 3000
            }
          });
        }
      } else {
        // Actualizar nuestra referencia local
        filesForThisGptRef.current = response.data.map(file => ({
          ...file,
          gptId: gptId
        }));
        
        dispatch({
          type: 'ui/showAlert',
          payload: {
            message: `${response.data.length} archivos disponibles`,
            severity: 'success',
            autoHideDuration: 2000
          }
        });
      }
    } catch (error) {
      console.error('[AssistantFilesManager] Error en actualización manual:', error);
      
      // Mostrar error al usuario
      dispatch({
        type: 'ui/showAlert',
        payload: {
          message: 'Error al actualizar los archivos: ' + (error.message || 'Error desconocido'),
          severity: 'error',
          autoHideDuration: 4000
        }
      });
    } finally {
      // Siempre restablecer estado
      setIsRefreshing(false);
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FileIcon />;

    const extension = filename.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <ImageIcon />;
    } else if (extension === 'pdf') {
      return <PdfIcon />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <DescriptionIcon />;
    } else {
      return <FileIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha desconocida';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Box sx={{  
      ...(isEmbedded && {
        maxHeight: '400px', // Limitar altura máxima cuando está embebido
        overflow: 'auto'    // Permitir scroll si el contenido es muy largo
      })
    }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Archivos para este asistente
          </Typography>

          <Box>
            <Tooltip title="Actualizar lista de archivos">
              <IconButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                sx={{ mr: 1 }}
              >
                {isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AttachFileIcon />}
              onClick={() => fileInputRef.current.click()}
              disabled={isUploading}
            >
              Seleccionar archivos
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Los archivos que subas estarán disponibles para el asistente en todas las conversaciones.
        </Typography>
      </Box>

      {/* Mensajes de estado */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                dispatch(clearGPTError());
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>Error al procesar archivos</AlertTitle>
          <Typography variant="body2">{error}</Typography>
          {error.includes('vector store') && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              La aplicación intentará guardar los archivos directamente en el asistente como alternativa.
            </Typography>
          )}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                dispatch(clearUploadSuccess());
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>¡Éxito!</AlertTitle>
          <Typography variant="body2">
            {uploadSuccess.message || "Archivos subidos correctamente"}
          </Typography>
          {uploadSuccess.details && uploadSuccess.details.errors && uploadSuccess.details.errors.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Algunos archivos tuvieron problemas. Revise la consola para más detalles.
            </Typography>
          )}
        </Alert>
      )}

      {/* Lista de archivos seleccionados para subir */}
      {selectedFiles.length > 0 && (
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Archivos seleccionados para subir
          </Typography>

          <List dense>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemoveSelected(index)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {getFileIcon(file.name)}
                </ListItemIcon>

                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              {isUploading ? 'Subiendo...' : 'Subir archivos'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Lista de archivos existentes */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1">
            Archivos disponibles para el asistente
          </Typography>
          
          <Box>
            {/* Auto-refresh indicator */}
            {!isRefreshing && userFiles && userFiles.length > 0 && (
              <Tooltip title="Siguiente actualización automática en progreso">
                <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', mr: 1 }}>
                  Auto-sync activo
                </Box>
              </Tooltip>
            )}
            
            {/* Manual refresh button with enhanced feedback */}
            <Button 
              variant="text" 
              size="small"
              color="primary" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </Box>
        </Box>

        {loading && userFiles.length === 0 ? (
          // Solo mostrar spinner si estamos cargando y no hay archivos aún
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : !userFiles || userFiles.length === 0 ? (
          // Mensaje cuando no hay archivos
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No hay archivos disponibles para este asistente
            </Typography>
            <Button 
              variant="text" 
              color="primary" 
              onClick={handleRefresh} 
              startIcon={<RefreshIcon />}
              sx={{ mt: 1 }}
            >
              Actualizar lista
            </Button>
          </Box>
        ) : (
          // Lista de archivos con estado mejorado
          <>
            {/* Indicador de actualización en progreso */}
            {loading && (
              <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1, mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={12} sx={{ mr: 1 }} />
                  Actualizando lista de archivos...
                </Typography>
              </Box>
            )}
            
            {/* Lista persistente de archivos */}
            <List>
              {userFiles.map((file) => (
                <React.Fragment key={file.id}>
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteConfirm(file)}
                        color="error"
                        disabled={!file.uploaded_by_app || isRefreshing || loading}
                        title={!file.uploaded_by_app ? "Solo se pueden eliminar archivos subidos desde esta aplicación" : ""}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      {getFileIcon(file.filename)}
                    </ListItemIcon>
  
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Tooltip title={file.filename}>
                            <Typography 
                              variant="body2" 
                              component="span" 
                              sx={{
                                // Truncar nombres de archivo largos
                                maxWidth: '180px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {file.filename}
                            </Typography>
                          </Tooltip>
                          {file.uploaded_by_app && (
                            <Tooltip title="Archivo subido desde esta aplicación">
                              <Box
                                component="span"
                                sx={{
                                  ml: 1,
                                  px: 0.7,
                                  py: 0.2,
                                  borderRadius: '4px',
                                  backgroundColor: 'success.main',
                                  color: 'success.contrastText',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                app
                              </Box>
                            </Tooltip>
                          )}
                          {file.source === 'assistant' && (
                            <Tooltip title="Archivo vinculado al asistente">
                              <Box
                                component="span"
                                sx={{
                                  ml: 1,
                                  px: 0.7,
                                  py: 0.2,
                                  borderRadius: '4px',
                                  backgroundColor: 'info.main',
                                  color: 'info.contrastText',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                asistente
                              </Box>
                            </Tooltip>
                          )}
                          {/* Estado de procesamiento destacado */}
                          {file.status === 'processing' && (
                            <Tooltip title="Archivo en procesamiento">
                              <Box
                                component="span"
                                sx={{
                                  ml: 1,
                                  px: 0.7,
                                  py: 0.2,
                                  borderRadius: '4px',
                                  backgroundColor: 'warning.light',
                                  color: 'warning.contrastText',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                <CircularProgress size={10} sx={{ mr: 0.5 }} />
                                procesando
                              </Box>
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" component="span">
                            {formatFileSize(file.bytes || 0)} • {formatDate(file.created_at)}
                          </Typography>
                          <Typography variant="caption" component="span" color="text.secondary">
                            ID: {file.id?.substring(0, 8)}...
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
            
            {/* Si hay archivos pero estamos actualizando, mostrar número en pantalla */}
            {isRefreshing && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Mostrando {userFiles.length} archivos • Actualizando...
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Información adicional */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <InfoIcon color="info" fontSize="small" sx={{ mr: 1 }} />
        <Typography variant="caption" color="textSecondary">
          Formatos permitidos: PDF, Word, Excel, PowerPoint, texto, imágenes. Máximo 20MB por archivo.
        </Typography>
      </Box>

      {/* Input oculto para selección de archivos */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept={ALLOWED_FILE_TYPES.join(',')}
      />

      {/* Diálogo de confirmación para eliminar archivo */}
      {confirmDelete && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            p: 3,
            width: '320px',
            zIndex: 1300,
            backgroundColor: 'background.paper'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Confirmar eliminación
          </Typography>

          <Typography variant="body2" gutterBottom>
            ¿Estás seguro de que quieres eliminar el archivo <strong>{confirmDelete.filename}</strong>?
          </Typography>

          <Typography variant="caption" color="error" gutterBottom display="block">
            Esta acción no se puede deshacer.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button
              onClick={cancelDelete}
              variant="outlined"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteFile}
              variant="contained"
              color="error"
              disabled={isDeleting}
            >
              {isDeleting ? <CircularProgress size={24} /> : 'Eliminar'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AssistantFilesManager;