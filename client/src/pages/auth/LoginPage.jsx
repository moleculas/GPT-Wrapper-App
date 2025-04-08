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
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff, Security } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { login, validate2FA, clearError } from '../../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, twoFactorRequired, userId } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    if (e.target.name === 'twoFactorCode') {
      // Solo permitir dígitos y limitar a 6 caracteres
      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
      setFormData({
        ...formData,
        [e.target.name]: value
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (twoFactorRequired) {
      dispatch(validate2FA({
        userId,
        token: formData.twoFactorCode
      }));
    } else {
      dispatch(login({
        email: formData.email,
        password: formData.password
      }));
    }
  };

  const renderLoginForm = () => (
    <>
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Correo electrónico"
        name="email"
        autoComplete="email"
        autoFocus
        value={formData.email}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Contraseña"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={formData.password}
        onChange={handleChange}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                aria-label="toggle password visibility"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </>
  );

  const render2FAForm = () => (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Security sx={{ fontSize: 24, mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Verificación en dos pasos</Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="body2" sx={{ mb: 3 }}>
        Tu cuenta está protegida con autenticación de dos factores. 
        Por favor, introduce el código de verificación de tu aplicación de autenticación.
      </Typography>
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="twoFactorCode"
        label="Código de verificación"
        name="twoFactorCode"
        autoFocus
        value={formData.twoFactorCode}
        onChange={handleChange}
        inputProps={{ 
          maxLength: 6,
          pattern: '[0-9]*',
          inputMode: 'numeric'
        }}
        placeholder="123456"
      />
    </>
  );

  return (
    <Container maxWidth="sm">
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        justifyContent: 'center',
        py: 4
      }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            borderRadius: 2
          }}
        >
          <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
            {twoFactorRequired ? 'Verificación de seguridad' : 'Iniciar sesión'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {twoFactorRequired ? render2FAForm() : renderLoginForm()}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || (twoFactorRequired && formData.twoFactorCode.length !== 6)}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                twoFactorRequired ? 'Verificar' : 'Iniciar sesión'
              )}
            </Button>

            {!twoFactorRequired && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register" style={{ color: '#10a37f' }}>
                    Regístrate
                  </Link>
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;