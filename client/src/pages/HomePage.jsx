import React, { useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardMedia, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGPTs } from '../redux/slices/gptSlice';
import MainLayout from '../components/layout/MainLayout';

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { gpts, loading } = useSelector(state => state.gpts);

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
          GPT Wrapper App
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph align="center">
          Una interfaz personalizada para interactuar con GPTs de OpenAI
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
          Bienvenido a GPT Wrapper
        </Typography>
        <Typography variant="body1" paragraph>
          Selecciona un GPT personalizado para comenzar a chatear o explora los disponibles.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            GPTs disponibles
          </Typography>
          
          {loading ? (
            <Typography>Cargando GPTs...</Typography>
          ) : gpts.length > 0 ? (
            <Grid container spacing={3}>
              {gpts.map((gpt) => (
                <Grid item key={gpt._id} xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" gutterBottom>
                No hay GPTs disponibles todavía.
              </Typography>
              {useSelector(state => state.auth.user?.role) === 'admin' && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/admin/gpts/new')}
                  sx={{ mt: 2 }}
                >
                  Crear nuevo GPT
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