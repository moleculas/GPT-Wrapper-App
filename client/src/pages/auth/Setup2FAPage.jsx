import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setup2FA, verify2FA, clearError } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';

const Setup2FAPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, twoFactorSetup, user } = useSelector(state => state.auth);

  const [verificationCode, setVerificationCode] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.twoFactorEnabled) {
      navigate('/profile');
      return;
    }

    if (!twoFactorSetup && !setupComplete) {
      dispatch(setup2FA());
    }
  }, [isAuthenticated, navigate, dispatch, twoFactorSetup, user, setupComplete]);

  const handleChange = (e) => {
    // Solo permitir dígitos y limitar a 6 caracteres
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(verify2FA(verificationCode))
      .unwrap()
      .then(() => {
        setSetupComplete(true);
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      });
  };

  const renderContent = () => {
    if (loading && !twoFactorSetup) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (setupComplete) {
      return (
        <Alert severity="success" sx={{ my: 2 }}>
          Verificación en dos pasos activada correctamente. Serás redirigido en unos segundos.
        </Alert>
      );
    }

    if (twoFactorSetup) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Escanea el código QR
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Utiliza una aplicación de autenticación como Google Authenticator, Authy
                  o Microsoft Authenticator para escanear este código QR.
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
                  color="primary"
                >
                  Copiar código secreto
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Código de verificación
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ingresa el código de 6 dígitos de tu aplicación de autenticación
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
                    inputProps={{ 
                      maxLength: 6,
                      pattern: '[0-9]*',
                      inputMode: 'numeric'
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    fullWidth
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Verificar y activar'
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Importante:</strong> Guarda una copia de tu código secreto en un lugar seguro. 
                Si pierdes acceso a tu dispositivo, necesitarás este código para recuperar tu cuenta.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      );
    }

    return null;
  };

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configuración de verificación en dos pasos
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {renderContent()}
      </Box>
    </MainLayout>
  );
};

export default Setup2FAPage;