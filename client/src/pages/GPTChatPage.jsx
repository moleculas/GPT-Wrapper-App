import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Avatar,
  CircularProgress,
  Button,
  Collapse
} from '@mui/material';
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
  const [initializing, setInitializing] = useState(true);
  const [messageLimit, setMessageLimit] = useState(10);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [filesManagerOpen, setFilesManagerOpen] = useState(false);

  const chatEndRef = useRef(null);

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

    if (!message.trim()) return;

    dispatch(sendMessageToAssistant({
      gptId: id,
      threadId,
      message
    }));

    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
          {fileAttachments.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                Archivos adjuntos:
              </Typography>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {fileAttachments.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      marginBottom: '4px'
                    }}
                  >
                    Archivo {index + 1}
                  </div>
                ))}
              </div>
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
                  Archivos personalizados
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
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  position: 'relative',
                  display: 'flex'
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Escribe un mensaje..."
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
                      padding: '12px 16px'
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '8px 0',
                      minHeight: '24px'
                    }
                  }}
                  disabled={chatLoading}
                />
              </Box>

              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>

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
                  {filesManagerOpen ? 'Ocultar archivos del asistente' : 'Gestionar archivos personalizados'}
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