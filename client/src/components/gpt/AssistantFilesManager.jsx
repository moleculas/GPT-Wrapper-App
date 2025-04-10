import React, { useState, useEffect, useRef } from 'react';
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { uploadAssistantFiles, getAssistantUserFiles, deleteAssistantFile, clearUploadSuccess } from '../../redux/slices/gptSlice';

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

  useEffect(() => {
    if (gptId) {
      dispatch(getAssistantUserFiles(gptId));
    }
  }, [dispatch, gptId]);

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
      alert(`Algunos archivos no pudieron ser procesados:\n${errors.join('\n')}`);
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

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;

    dispatch(uploadAssistantFiles({
      gptId,
      files: selectedFiles
    }))
      .unwrap()
      .then(() => {
        setSelectedFiles([]);
        setTimeout(() => {
          dispatch(getAssistantUserFiles(gptId));
        }, 1000);
      })
      .catch(error => {
        console.error('Error al subir archivos:', error);
      });
  };


  const handleDeleteConfirm = (file) => {
    setConfirmDelete(file);
  };

  const confirmDeleteFile = () => {
    if (!confirmDelete) return;

    dispatch(deleteAssistantFile({
      gptId,
      fileId: confirmDelete.id
    }))
      .unwrap()
      .then(() => {
        setConfirmDelete(null);
      })
      .catch(error => {
        console.error('Error al eliminar archivo:', error);
      });
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleRemoveSelected = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRefresh = () => {

    dispatch({ type: 'gpts/getFiles/pending' });

    setTimeout(() => {
      dispatch(getAssistantUserFiles(gptId));
    }, 2000);
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
                disabled={loading}
                sx={{ mr: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AttachFileIcon />}
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Archivos subidos correctamente
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
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              {loading ? 'Subiendo...' : 'Subir archivos'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Lista de archivos existentes */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Archivos disponibles para el asistente
        </Typography>

        {loading && !userFiles ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : !userFiles || userFiles.length === 0 ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No hay archivos disponibles para este asistente subidos desde esta aplicación
            </Typography>
          </Box>
        ) : (
          <List>
            {userFiles.map((file) => (
              <React.Fragment key={file.id}>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteConfirm(file)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    {getFileIcon(file.filename)}
                  </ListItemIcon>

                  <ListItemText
                    primary={file.filename}
                    secondary={
                      <>
                        {formatFileSize(file.bytes)} • {formatDate(file.created_at)}
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
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
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteFile}
              variant="contained"
              color="error"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Eliminar'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AssistantFilesManager;