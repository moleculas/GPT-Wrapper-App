import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Switch,
  Radio,
  Button,
  Paper
} from '@mui/material';
import { toggleDarkMode, setActiveView, toggleSystemAlerts, toggleNotificationSounds } from '../../redux/slices/uiSlice';
import MainLayout from '../../components/layout/MainLayout';
import { addAlert } from '../../redux/slices/uiSlice';

const SettingsView = () => {
  const dispatch = useDispatch();
  const { darkMode, activeView, notifications } = useSelector(state => state.ui);

  const handleSaveChanges = () => {
    dispatch(addAlert({
      message: 'Configuración guardada correctamente',
      type: 'success'
    }));
  };

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          Configuración
        </Typography>

        {/* Contenedor flexbox para las tres tarjetas */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            mb: 3,
            width: '100%'
          }}
        >
          {/* Apariencia */}
          <Paper
            sx={{
              flex: 1,
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              width: { xs: '100%', md: '33.33%' }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Apariencia
              </Typography>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 2,
              }}>
                <Typography variant="body1">
                  Modo oscuro
                </Typography>
                <Switch
                  checked={darkMode}
                  onChange={() => dispatch(toggleDarkMode())}
                  color="primary"
                />
              </Box>
            </Box>
          </Paper>

          {/* Notificaciones */}
          <Paper
            sx={{
              flex: 1,
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              width: { xs: '100%', md: '33.33%' }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notificaciones
              </Typography>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 2,
                mb: 3
              }}>
                <Typography variant="body1">
                  Mostrar alertas de sistema
                </Typography>
                <Switch
                  checked={notifications?.systemAlerts}
                  onChange={() => dispatch(toggleSystemAlerts())}
                  color="primary"
                />
              </Box>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Typography variant="body1">
                  Sonidos de notificación
                </Typography>
                <Switch
                  checked={notifications?.sounds}
                  onChange={() => dispatch(toggleNotificationSounds())}
                  color="primary"
                />
              </Box>
            </Box>
          </Paper>

          {/* Vista predeterminada */}
          <Paper
            sx={{
              flex: 1,
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              width: { xs: '100%', md: '33.33%' }
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vista predeterminada
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Radio
                    checked={activeView === 'chat'}
                    onChange={() => dispatch(setActiveView('chat'))}
                    color="primary"
                    id="chat-option"
                  />
                  <label htmlFor="chat-option">Chat</label>
                </Box>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Radio
                    checked={activeView === 'admin'}
                    onChange={() => dispatch(setActiveView('admin'))}
                    color="primary"
                    id="admin-option"
                  />
                  <label htmlFor="admin-option">Administración</label>
                </Box>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Radio
                    checked={activeView === 'settings'}
                    onChange={() => dispatch(setActiveView('settings'))}
                    color="primary"
                    id="settings-option"
                  />
                  <label htmlFor="settings-option">Configuración</label>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Botón Guardar Cambios */}
        <Button
          variant="contained"
          onClick={handleSaveChanges}
          sx={{
            bgcolor: '#10a37f',
            color: 'white',
            '&:hover': { bgcolor: '#0e8f6f' },
            textTransform: 'none',
            fontWeight: 500,
            px: 3
          }}
        >
          Guardar cambios
        </Button>
      </Box>
    </MainLayout>
  );
};

export default SettingsView;