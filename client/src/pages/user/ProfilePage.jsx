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
  Switch,
  FormControlLabel
} from '@mui/material';
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
    // Por ahora solo mostraremos una alerta
    dispatch(addAlert({ 
      message: 'Perfil actualizado correctamente', 
      type: 'success' 
    }));
  };
  
  const handle2FASetup = () => {
    navigate('/setup-2fa');
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
                <Typography variant="h6" gutterBottom>
                  Seguridad
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Verificación en dos pasos
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="body2" color="textSecondary">
                      {user.twoFactorEnabled 
                        ? 'La verificación en dos pasos está activada' 
                        : 'Mejora la seguridad de tu cuenta activando la verificación en dos pasos'}
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user.twoFactorEnabled}
                          onChange={handle2FASetup}
                          disabled={user.twoFactorEnabled}
                        />
                      }
                      label=""
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Cambiar contraseña
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  // Esta funcionalidad se implementaría en un paso posterior
                  onClick={() => dispatch(addAlert({ 
                    message: 'Funcionalidad de cambio de contraseña en desarrollo', 
                    type: 'info' 
                  }))}
                >
                  Cambiar contraseña
                </Button>
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