// Ruta: client/src/pages/admin/GPTFormPage.jsx

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
  Divider,
  Autocomplete
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGPT, createGPT, updateGPT, fetchAvailableGPTs } from '../../redux/slices/gptSlice';
import { addAlert } from '../../redux/slices/uiSlice';
import MainLayout from '../../components/layout/MainLayout';

const GPTFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentGPT, loading, error, availableGPTs } = useSelector(state => state.gpts);
  const { user } = useSelector(state => state.auth);

  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    openaiId: '',
    model: '',
    imageUrl: ''
  });

  const [selectedGPT, setSelectedGPT] = useState(null);

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
    } else {
      dispatch(fetchAvailableGPTs());
    }
  }, [dispatch, navigate, isEditMode, id, user]);

  useEffect(() => {
    if (isEditMode && currentGPT) {
      setFormData({
        name: currentGPT.name || '',
        description: currentGPT.description || '',
        openaiId: currentGPT.openaiId || '',
        model: currentGPT.model || '',
        imageUrl: currentGPT.imageUrl || ''
      });
    }
  }, [isEditMode, currentGPT]);

  useEffect(() => {
    if (selectedGPT) {
      setFormData(prev => ({
        ...prev,
        openaiId: selectedGPT.id || '',
        model: selectedGPT.model || ''
      }));
    }
  }, [selectedGPT]);

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
          {isEditMode ? 'Editar Asistente' : 'Importar Asistente desde OpenAI'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3, bgcolor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {isEditMode
              ? 'Actualiza la información y configuración de este Asistente en la aplicación.'
              : 'Importa un Asistente personalizado desde tu cuenta de OpenAI. El Asistente debe existir previamente en tu cuenta empresarial de OpenAI.'}
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

              {/* Primera fila: Nombre y selector de GPT de OpenAI */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  required
                  label="Nombre del Asistente"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="Nombre con el que aparecerá en la aplicación"
                />

                {isEditMode ? (
                  <TextField
                    fullWidth
                    required
                    label="ID de OpenAI"
                    name="openaiId"
                    value={formData.openaiId}
                    variant="outlined"
                    helperText="ID único del Asistente en OpenAI"
                    disabled={true}
                  />
                ) : (
                  <Autocomplete
                    fullWidth
                    id="gpt-selector"
                    options={availableGPTs || []}
                    loading={loading}
                    value={selectedGPT}
                    onChange={(event, newValue) => {
                      setSelectedGPT(newValue);
                      if (!newValue) {
                        setFormData(prev => ({
                          ...prev,
                          openaiId: '',
                          model: ''
                        }));
                      }
                    }}
                    getOptionLabel={(option) => option.name}
                    renderOption={(props, option) => {
                      const { key, ...propsWithoutKey } = props;
                      return (
                        <li {...propsWithoutKey} key={option.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body1">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.id}
                            </Typography>
                          </Box>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Seleccionar Asistente de OpenAI"
                        required
                        helperText={
                          loading
                            ? "Cargando Asistentes disponibles..."
                            : availableGPTs && availableGPTs.length === 0
                              ? "No se encontraron Asistentes disponibles"
                              : "Selecciona un Asistente de tu cuenta de OpenAI"
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    noOptionsText="No hay Asistentes disponibles en tu cuenta de OpenAI"
                  />
                )}
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
                helperText="Breve descripción de lo que hace este Asistente"
              />

              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Configuración técnica
                </Typography>
              </Box>

              {/* Segunda fila: Modelo y URL de imagen */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Modelo base"
                  name="model"
                  value={formData.model}
                  variant="outlined"
                  helperText="Modelo base del Asistente"
                  disabled={true}
                />

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
                  disabled={loading || (!isEditMode && !selectedGPT)}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    isEditMode ? 'Actualizar Asistente' : 'Importar Asistente'
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