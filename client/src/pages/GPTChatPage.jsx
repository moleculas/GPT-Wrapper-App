import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGPT, chatWithGPT, clearChatResponse } from '../redux/slices/gptSlice';
import MainLayout from '../components/layout/MainLayout';

const GPTChatPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentGPT, loading: gptLoading } = useSelector(state => state.gpts);
  const { response, loading: chatLoading, error } = useSelector(state => state.gpts.chat);

  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [files, setFiles] = useState([]);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchGPT(id));
      dispatch(clearChatResponse());
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (response) {
      const assistantMessage = response.choices && response.choices[0]
        ? response.choices[0].message.content
        : 'No pude generar una respuesta. Por favor, intenta de nuevo.';

      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: assistantMessage }
      ]);
    }
  }, [response]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!message.trim() && files.length === 0) return;
    setConversation(prev => [
      ...prev,
      { role: 'user', content: message, files: files }
    ]);

    dispatch(chatWithGPT({ id, message, files }));
    setMessage('');
    setFiles([]);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  return (
    <MainLayout>
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 130px)'
      }}>
        {gptLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <CircularProgress />
          </Box>
        ) : currentGPT ? (
          <>
            {/* Cabecera del chat */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <Typography variant="h6">{currentGPT.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {currentGPT.description}
              </Typography>
            </Box>

            {/* Área de conversación */}
            <Box sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {conversation.length === 0 ? (
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
                conversation.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      mb: 2,
                      alignItems: 'flex-start'
                    }}
                  >
                    <Avatar
                      sx={{
                        mr: 2,
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main'
                      }}
                    >
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </Avatar>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: msg.role === 'user' ? 'rgba(16, 163, 127, 0.1)' : 'background.paper',
                        borderRadius: '8px'
                      }}
                    >
                      <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>

                      {msg.files && msg.files.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption">
                            Archivos adjuntos: {msg.files.map(f => f.name).join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                ))
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
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
              {files.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption">
                    Archivos: {files.map(f => f.name).join(', ')}
                    <Button
                      size="small"
                      color="secondary"
                      onClick={() => setFiles([])}
                      sx={{ ml: 1 }}
                    >
                      Limpiar
                    </Button>
                  </Typography>
                </Box>
              )}

              <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
                <TextField
                  fullWidth
                  placeholder="Escribe un mensaje..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  variant="outlined"
                  sx={{ mr: 1 }}
                  disabled={chatLoading}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => fileInputRef.current.click()}
                        disabled={chatLoading}
                      >
                        <AttachFileIcon />
                      </IconButton>
                    )
                  }}
                />
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<SendIcon />}
                  type="submit"
                  disabled={(!message.trim() && files.length === 0) || chatLoading}
                >
                  Enviar
                </Button>
              </form>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <Typography>GPT no encontrado</Typography>
          </Box>
        )}
      </Box>
    </MainLayout>
  );
};

export default GPTChatPage;