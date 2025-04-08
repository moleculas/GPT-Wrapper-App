import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Security,
  VpnKey,
  Shield,
  VerifiedUser
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { addAlert } from '../../redux/slices/uiSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para actualizar el perfil de usuario
    dispatch(addAlert({
      message: 'Perfil actualizado correctamente',
      type: 'success'
    }));
  };

  const handle2FASetup = () => {
    navigate('/setup-2fa');
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  if (!user) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Cargando información de usuario...</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, pt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Perfil de usuario
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Información personal
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  required
                  label="Nombre"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                  margin="normal"
                />

                <TextField
                  fullWidth
                  required
                  label="Correo electrónico"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  variant="outlined"
                  margin="normal"
                  disabled
                  helperText="El correo electrónico no puede ser modificado"
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Actualizar perfil'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ fontSize: 24, mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Seguridad
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {/* Sección de verificación en dos pasos */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Shield
                        color={user.twoFactorEnabled ? "success" : "action"}
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="subtitle1">
                        Verificación en dos pasos
                      </Typography>
                    </Box>
                    {!user.twoFactorEnabled && (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handle2FASetup}
                        size="small"
                      >
                        Activar
                      </Button>
                    )}
                    {user.twoFactorEnabled && (
                      <VerifiedUser color="success" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ px: 6 }}>
                    {user.twoFactorEnabled
                      ? "La verificación en dos pasos está activada"
                      : "Mejora la seguridad de tu cuenta activando la verificación en dos pasos"
                    }
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Sección de cambio de contraseña */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <VpnKey sx={{ mr: 2 }} />
                      <Typography variant="subtitle1">
                        Cambiar contraseña
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={handleChangePassword}
                    >
                      Cambiar
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ px: 6 }}>
                    Actualiza tu contraseña regularmente para mayor seguridad
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {user.role === 'admin' && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Administración
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/admin/gpts')}
                    fullWidth
                  >
                    Gestionar Asistentes
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default ProfilePage;