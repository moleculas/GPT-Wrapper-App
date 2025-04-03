import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Avatar,
  CircularProgress,
  IconButton,
  Button,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Collapse,
  Divider
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ResetIcon from '@mui/icons-material/RestartAlt';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import {
  fetchGPT,
  createThread,
  sendMessageToAssistant,
  getThreadMessages,
  resetGPTMemory
} from '../redux/slices/gptSlice';
import MainLayout from '../components/layout/MainLayout';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import AssistantFilesManager from '../components/gpt/AssistantFilesManager';

const GPTChatPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentGPT, loading: gptLoading } = useSelector(state => state.gpts);
  const { threadId, messages, loading: chatLoading, error } = useSelector(state => state.gpts.chat || {});

  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [initializing, setInitializing] = useState(true);
  const [messageLimit, setMessageLimit] = useState(10);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filesManagerOpen, setFilesManagerOpen] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
  ];

  useEffect(() => {
    if (id) {
      dispatch(fetchGPT(id))
        .then(() => {
          return dispatch(createThread(id));
        })
        .then((result) => {
          if (result?.payload?.data?.id) {
            return dispatch(getThreadMessages(result.payload.data.id));
          } else if (threadId) {
            return dispatch(getThreadMessages(threadId));
          }
        })
        .catch((error) => {
          console.error("Error inicializando chat:", error);
        })
        .finally(() => {
          setInitializing(false);
        });
    }
  }, [dispatch, id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!message.trim() && files.length === 0) return;

    // Preparar los archivos para enviar
    const processedFiles = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      data: file.data // La data en base64
    }));

    console.log('Enviando mensaje con archivos:', processedFiles.length);

    dispatch(sendMessageToAssistant({
      gptId: id,
      threadId,
      message,
      files: processedFiles
    }));

    setMessage('');
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await processFiles(selectedFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFiles = async (selectedFiles) => {
    const newFiles = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(`Tipo de archivo no permitido: ${file.type}`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`El archivo ${file.name} excede el tamaño máximo permitido (20MB)`);
        continue;
      }

      const base64Data = await readFileAsBase64(file);

      newFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        preview: file.type.startsWith('image/') ? base64Data : null,
        data: base64Data.split(',')[1]
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon />;
    if (fileType === 'application/pdf') return <PictureAsPdfIcon />;
    if (fileType.includes('document')) return <DescriptionIcon />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleResetConfirm = () => {
    dispatch(resetGPTMemory(id))
      .then(() => {
        return dispatch(createThread(id));
      })
      .then((result) => {
        if (result?.payload?.data?.id) {
          return dispatch(getThreadMessages(result.payload.data.id));
        }
      })
      .then(() => {
        setInitializing(false);
      })
      .catch((error) => {
        setInitializing(false);
      });
  };

  const handleResetButtonClick = () => {
    setResetDialogOpen(true);
  };

  const renderMessage = (msg) => {
    const isUser = msg.role === 'user';
    const messageContent = msg.content[0]?.text?.value || "";

    const fileAttachments = msg.content
      .filter(contentItem => contentItem.type === 'image_file' || contentItem.type === 'file_attachment')
      .map(file => ({
        id: file.file_id,
        type: file.type
      }));

    return (
      <Box
        sx={{
          display: 'flex',
          mb: 2,
          alignItems: 'flex-start'
        }}
      >
        <Avatar
          sx={{
            mr: 2,
            bgcolor: isUser ? 'primary.main' : 'secondary.main'
          }}
        >
          {isUser ? 'U' : 'AI'}
        </Avatar>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            maxWidth: '70%',
            backgroundColor: isUser ? 'rgba(16, 163, 127, 0.1)' : 'background.paper',
            borderRadius: '8px'
          }}
        >
          {/* Mostrar archivos adjuntos si hay */}
          {fileAttachments.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                Archivos adjuntos:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {fileAttachments.map((file, index) => (
                  <Chip
                    key={index}
                    icon={<AttachFileIcon />}
                    label={`Archivo ${index + 1}`}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {isUser ? (
            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
              {messageContent}
            </Typography>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <Typography variant="body1" gutterBottom {...props} />,
                h1: ({ node, ...props }) => <Typography variant="h6" gutterBottom {...props} />,
                h2: ({ node, ...props }) => <Typography variant="subtitle1" gutterBottom {...props} />,
                h3: ({ node, ...props }) => <Typography variant="subtitle2" gutterBottom {...props} />,
                ul: ({ node, ...props }) => <Box component="ul" sx={{ pl: 2 }} {...props} />,
                ol: ({ node, ...props }) => <Box component="ol" sx={{ pl: 2 }} {...props} />,
                li: ({ node, ...props }) => <Typography component="li" variant="body1" gutterBottom {...props} />,
                code: ({ node, inline, ...props }) =>
                  inline ?
                    <Typography component="code" variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0, 0, 0, 0.05)', p: 0.5, borderRadius: 1 }} {...props} /> :
                    <Box component="pre" sx={{ p: 1.5, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1, overflow: 'auto', maxWidth: '100%' }}>
                      <Typography component="code" variant="body2" sx={{ fontFamily: 'monospace' }} {...props} />
                    </Box>
              }}
            >
              {messageContent}
            </ReactMarkdown>
          )}
        </Paper>
      </Box>
    );
  };

  const visibleMessages = messages ? messages.filter(msg =>
    msg.metadata?.system_instruction !== "true"
  ) : [];

  if (gptLoading || initializing) {
    return (
      <MainLayout>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          overflow: 'hidden'
        }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {currentGPT ? (
          <>
            {/* Cabecera del chat */}
            <Box sx={{
              p: 2,
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6">{currentGPT.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {currentGPT.description}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Botón para gestionar archivos permanentes */}
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => setFilesManagerOpen(!filesManagerOpen)}
                  startIcon={<FolderIcon />}
                  endIcon={filesManagerOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Archivos del asistente
                </Button>

                {/* Botón de reseteo de memoria - solo visible si hay mensajes */}
                {visibleMessages && visibleMessages.length > 0 && (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={handleResetButtonClick}
                    disabled={chatLoading}
                    startIcon={<ResetIcon />}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Resetear memoria
                  </Button>
                )}
              </Box>
            </Box>

            {/* Panel expandible para gestionar archivos del asistente */}
            <Collapse in={filesManagerOpen} timeout="auto">
              <Box sx={{
                p: 2,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                position: 'relative',
                zIndex: 10,
                backgroundColor: 'background.default'
              }}>
                <AssistantFilesManager gptId={id} />
              </Box>
            </Collapse>

            {/* Área de conversación (único lugar con scroll) */}
            <Box sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 1
            }}>
              {!visibleMessages || visibleMessages.length === 0 ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <Typography variant="body1">
                    Envía un mensaje para comenzar la conversación
                  </Typography>
                </Box>
              ) : (
                <>
                  {visibleMessages.length > messageLimit && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Button
                        variant="text"
                        onClick={() => setMessageLimit(prev => prev + 10)}
                        sx={{ fontSize: '0.85rem' }}
                      >
                        Cargar mensajes anteriores
                      </Button>
                    </Box>
                  )}

                  {visibleMessages.length > messageLimit && (
                    <Box sx={{
                      p: 1,
                      mb: 2,
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption">
                        Conversación basada en {visibleMessages.length} mensajes. Mostrando los {messageLimit} más recientes.
                      </Typography>
                    </Box>
                  )}

                  {/* Mostrar solo los últimos 'messageLimit' mensajes visibles */}
                  {visibleMessages.slice(-messageLimit).map((msg) => (
                    <Box key={msg.id}>
                      {renderMessage(msg)}
                    </Box>
                  ))}
                </>
              )}

              {chatLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {error && (
                <Box sx={{
                  p: 2,
                  backgroundColor: 'error.light',
                  borderRadius: '8px',
                  color: 'error.contrastText',
                  my: 2
                }}>
                  <Typography variant="body2">
                    Error: {error}
                  </Typography>
                </Box>
              )}

              <div ref={chatEndRef} />
            </Box>

            {/* Área de entrada de mensajes */}
            <Box sx={{
              p: 2,
              flexShrink: 0
            }}>
              {/* Área de archivos seleccionados */}
              {files.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    mb: 2,
                    borderRadius: '8px',
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                    Archivos seleccionados:
                  </Typography>
                  <List dense disablePadding>
                    {files.map((file, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton edge="end" size="small" onClick={() => handleRemoveFile(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                        sx={{ py: 0.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getFileIcon(file.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={formatFileSize(file.size)}
                          primaryTypographyProps={{ variant: 'caption', noWrap: true }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Formulario de mensaje con soporte para drag & drop */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                onDragEnter={handleDrag}
                sx={{
                  position: 'relative',
                  display: 'flex'
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Escribe un mensaje o arrastra archivos aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  variant="outlined"
                  multiline
                  maxRows={4}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: theme => theme.palette.background.paper,
                      ...(dragActive && {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                      })
                    }
                  }}
                  disabled={chatLoading}
                  InputProps={{
                    endAdornment: (
                      <Tooltip title="Adjuntar archivos">
                        <IconButton
                          onClick={() => fileInputRef.current.click()}
                          disabled={chatLoading}
                          edge="end"
                        >
                          <AttachFileIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept={ALLOWED_FILE_TYPES.join(',')}
                />

                {/* Overlay para drop zone */}
                {dragActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '8px',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1,
                      border: '2px dashed',
                      borderColor: 'primary.main'
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Typography>Suelta los archivos aquí</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                  Formatos permitidos: imágenes, PDF, documentos, hojas de cálculo. Máximo 20MB por archivo.
                </Typography>

                {/* Añadimos un texto clickeable para abrir el panel de archivos permanentes */}
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => setFilesManagerOpen(!filesManagerOpen)}
                >
                  {filesManagerOpen ? 'Ocultar archivos del asistente' : 'Mostrar archivos del asistente'}
                </Typography>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <Typography>Asistente no encontrado</Typography>
          </Box>
        )}
      </Box>

      {/* Diálogo de confirmación para resetear memoria */}
      <ConfirmDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
        title="Resetear memoria de conversación"
        content="¿Estás seguro de que deseas eliminar toda la memoria de esta conversación con el asistente? Esta acción no se puede deshacer y se perderá todo el historial."
        confirmText="Resetear"
        cancelText="Cancelar"
        confirmColor="primary"
      />
    </MainLayout>
  );
};

export default GPTChatPage;