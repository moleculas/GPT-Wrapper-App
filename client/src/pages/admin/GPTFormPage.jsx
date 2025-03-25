import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGPT, createGPT, updateGPT } from '../../redux/slices/gptSlice';
import { addAlert } from '../../redux/slices/uiSlice';
import MainLayout from '../../components/layout/MainLayout';

const GPTFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentGPT, loading, error } = useSelector(state => state.gpts);
  const { user } = useSelector(state => state.auth);
  
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    openaiId: '',
    model: 'gpt-4',
    imageUrl: '',
    isPublic: false
  });
  
  useEffect(() => {
    // Verificar si el usuario es administrador
    if (user && user.role !== 'admin') {
      navigate('/');
      dispatch(addAlert({ 
        message: 'No tienes permisos para acceder a esta sección', 
        type: 'error' 
      }));
      return;
    }
    
    // Si estamos en modo edición, cargar los datos del GPT
    if (isEditMode) {
      dispatch(fetchGPT(id));
    }
  }, [dispatch, navigate, isEditMode, id, user]);
  
  useEffect(() => {
    // Rellenar el formulario con los datos del GPT si estamos en modo edición
    if (isEditMode && currentGPT) {
      setFormData({
        name: currentGPT.name || '',
        description: currentGPT.description || '',
        instructions: currentGPT.instructions || '',
        openaiId: currentGPT.openaiId || '',
        model: currentGPT.model || 'gpt-4',
        imageUrl: currentGPT.imageUrl || '',
        isPublic: currentGPT.isPublic || false
      });
    }
  }, [isEditMode, currentGPT]);
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'isPublic' ? checked : value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditMode) {
      dispatch(updateGPT({ id, gptData: formData }))
        .unwrap()
        .then(() => {
          dispatch(addAlert({ 
            message: 'GPT actualizado correctamente', 
            type: 'success' 
          }));
          navigate('/admin/gpts');
        })
        .catch((error) => {
          dispatch(addAlert({ 
            message: `Error al actualizar el GPT: ${error.message || 'Desconocido'}`, 
            type: 'error' 
          }));
        });
    } else {
      dispatch(createGPT(formData))
        .unwrap()
        .then(() => {
          dispatch(addAlert({ 
            message: 'GPT creado correctamente', 
            type: 'success' 
          }));
          navigate('/admin/gpts');
        })
        .catch((error) => {
          dispatch(addAlert({ 
            message: `Error al crear el GPT: ${error.message || 'Desconocido'}`, 
            type: 'error' 
          }));
        });
    }
  };
  
  if (loading && isEditMode) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, pt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Editar GPT' : 'Añadir nuevo GPT'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Información básica
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombre del GPT"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="ID de OpenAI"
                  name="openaiId"
                  value={formData.openaiId}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="ID único del GPT en OpenAI"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Descripción"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  variant="outlined"
                  multiline
                  rows={2}
                  helperText="Breve descripción de lo que hace este GPT"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Configuración técnica
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="model-select-label">Modelo base</InputLabel>
                  <Select
                    labelId="model-select-label"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    label="Modelo base"
                  >
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                    <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="URL de imagen"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="URL de una imagen representativa (opcional)"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Instrucciones del sistema"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  variant="outlined"
                  multiline
                  rows={4}
                  helperText="Instrucciones que definen el comportamiento y conocimiento del GPT"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Permisos
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isPublic}
                      onChange={handleChange}
                      name="isPublic"
                      color="primary"
                    />
                  }
                  label="Disponible para todos los usuarios"
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate('/admin/gpts')}
                  sx={{ mr: 2 }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    isEditMode ? 'Actualizar GPT' : 'Crear GPT'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default GPTFormPage;