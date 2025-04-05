import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Paper,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGPTs } from '../redux/slices/gptSlice';
import MainLayout from '../components/layout/MainLayout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { gpts, loading } = useSelector(state => state.gpts);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchGPTs());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Assistant Wrapper App
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph align="center">
          Una interfaz personalizada para interactuar con asistentes de OpenAI
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ mx: 1 }}
          >
            Iniciar sesión
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ mx: 1 }}
          >
            Registrarse
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, pt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bienvenido a Assistant Wrapper
        </Typography>
        <Typography variant="body1" paragraph>
          Selecciona un asistente para comenzar a chatear o explora los disponibles.
        </Typography>

        {/* Panel de administración - solo visible para administradores */}
        {isAdmin && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              mt: 2,
              border: '1px solid #e0e0e0',
              borderLeft: '4px solid #10a37f',
              bgcolor: '#f9f9f9',
              borderRadius: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AdminPanelSettingsIcon sx={{ mr: 1, color: '#10a37f' }} />
              <Typography variant="h6" component="h2">
                Panel de Administración
              </Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" color="text.secondary" paragraph>
              Como administrador, puedes gestionar los GPTs disponibles en la plataforma, importar nuevos GPTs desde OpenAI y controlar quién tiene acceso a ellos.
            </Typography>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/gpts')}
                startIcon={<AdminPanelSettingsIcon />}
              >
                Gestionar Asistentes
              </Button>

              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/admin/gpts/new')}
              >
                Importar nuevo Asistente
              </Button>
            </Box>
          </Paper>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Asistentes disponibles
          </Typography>

          {loading ? (
            <Typography>Cargando Asistentes...</Typography>
          ) : gpts && gpts.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {gpts.map((gpt) => (
                <Card 
                  key={gpt._id} 
                  sx={{ 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column' 
                  }}
                >
                  <CardActionArea onClick={() => navigate(`/gpts/${gpt._id}`)}>
                    {gpt.imageUrl && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={gpt.imageUrl}
                        alt={gpt.name}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div">
                        {gpt.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {gpt.description}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Modelo: {gpt.model}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" gutterBottom>
                No hay GPTs disponibles todavía.
              </Typography>
              {isAdmin && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/admin/gpts/new')}
                  sx={{ mt: 2 }}
                >
                  Importar nuevo Asistente
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default HomePage;