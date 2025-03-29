import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
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
    openaiId: '',
    model: 'gpt-4',
    imageUrl: ''
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      dispatch(addAlert({
        message: 'No tienes permisos para acceder a esta sección',
        type: 'error'
      }));
      return;
    }

    if (isEditMode) {
      dispatch(fetchGPT(id));
    }
  }, [dispatch, navigate, isEditMode, id, user]);

  useEffect(() => {
    if (isEditMode && currentGPT) {
      setFormData({
        name: currentGPT.name || '',
        description: currentGPT.description || '',
        openaiId: currentGPT.openaiId || '',
        model: currentGPT.model || 'gpt-4',
        imageUrl: currentGPT.imageUrl || ''
      });
    }
  }, [isEditMode, currentGPT]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        .then((response) => {
          dispatch(addAlert({
            message: 'GPT importado correctamente',
            type: 'success'
          }));
          const gptId = response?.data?._id;
          if (gptId) {
            navigate(`/admin/gpts/${gptId}/permissions`);
          } else {
            console.error('No se pudo obtener el ID del GPT creado', response);
            dispatch(addAlert({
              message: 'GPT importado, pero hubo un problema al navegar a la configuración de permisos',
              type: 'warning'
            }));
            navigate('/admin/gpts');
          }
        })
        .catch((error) => {
          console.error('Error completo:', error);
          dispatch(addAlert({
            message: `Error al importar el GPT: ${error.message || 'Desconocido'}`,
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
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Editar GPT' : 'Importar GPT desde OpenAI'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3, bgcolor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {isEditMode
              ? 'Actualiza la información y configuración de este GPT en la aplicación.'
              : 'Importa un GPT personalizado desde tu cuenta de OpenAI. El GPT debe existir previamente en tu cuenta empresarial de OpenAI.'}
          </Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Información básica
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Box>

              {/* Primera fila: Nombre y ID de OpenAI */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  required
                  label="Nombre del GPT"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="Nombre con el que aparecerá en la aplicación"
                />

                <TextField
                  fullWidth
                  required
                  label="ID de OpenAI"
                  name="openaiId"
                  value={formData.openaiId}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="ID único del GPT en OpenAI"
                  disabled={isEditMode}
                />
              </Stack>

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

              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Configuración técnica
                </Typography>
              </Box>

              {/* Segunda fila: Modelo y URL de imagen */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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

                <TextField
                  fullWidth
                  label="URL de imagen"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="URL de una imagen representativa (opcional)"
                />
              </Stack>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="inherit"
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
                    isEditMode ? 'Actualizar GPT' : 'Importar GPT'
                  )}
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default GPTFormPage;