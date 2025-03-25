import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setup2FA, verify2FA, clearError } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Setup2FAPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, twoFactorSetup, user } = useSelector(state => state.auth);
  
  const [verificationCode, setVerificationCode] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  
  useEffect(() => {
    // Redireccionar si no está autenticado
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Si el 2FA ya está activo, redireccionar
    if (user && user.twoFactorEnabled) {
      navigate('/profile');
      return;
    }
    
    // Si no hay configuración de 2FA, iniciar la configuración
    if (!twoFactorSetup && !setupComplete) {
      dispatch(setup2FA());
    }
  }, [isAuthenticated, navigate, dispatch, twoFactorSetup, user, setupComplete]);
  
  const handleChange = (e) => {
    setVerificationCode(e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(verify2FA(verificationCode))
      .unwrap()
      .then(() => {
        setSetupComplete(true);
        // Esperar un poco antes de redireccionar
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      });
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minHeight: '100vh',
        justifyContent: 'center'
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%' 
          }}
        >
          <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
            Configuración de verificación en dos pasos
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {setupComplete && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Verificación en dos pasos activada correctamente. Serás redirigido en unos segundos.
            </Alert>
          )}
          
          {loading && !twoFactorSetup ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
              <CircularProgress />
            </Box>
          ) : twoFactorSetup && !setupComplete ? (
            <>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Escanea el código QR
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Utiliza una aplicación de autenticación como Google Authenticator, Authy o Microsoft Authenticator para escanear este código QR.
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: 2, 
                    mb: 2 
                  }}>
                    <img 
                      src={twoFactorSetup.qrCode} 
                      alt="Código QR para 2FA" 
                      style={{ maxWidth: '200px' }} 
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigator.clipboard.writeText(twoFactorSetup.secret)}
                  >
                    Copiar código secreto
                  </Button>
                </CardActions>
              </Card>
              
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="verificationCode"
                  label="Código de verificación"
                  name="verificationCode"
                  autoFocus
                  value={verificationCode}
                  onChange={handleChange}
                  helperText="Ingresa el código de 6 dígitos de tu aplicación de autenticación"
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Verificar y activar'
                  )}
                </Button>
              </Box>
            </>
          ) : null}
        </Paper>
      </Box>
    </Container>
  );
};

export default Setup2FAPage;