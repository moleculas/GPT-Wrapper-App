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
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
    // Limpiar errores cuando se monta el componente
    dispatch(clearError());
    
    // Redirigir si ya está autenticado
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, dispatch]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
            {twoFactorRequired ? 'Verificación en dos pasos' : 'Iniciar sesión'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {!twoFactorRequired ? (
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
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </>
            ) : (
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
              />
            )}
            
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