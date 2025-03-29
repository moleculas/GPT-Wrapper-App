import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';
import AlertMessage from './components/ui/AlertMessage';

// Páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Setup2FAPage from './pages/auth/Setup2FAPage';
import ProfilePage from './pages/user/ProfilePage';
import GPTChatPage from './pages/GPTChatPage';
import AdminGPTsPage from './pages/admin/AdminGPTsPage';
import GPTFormPage from './pages/admin/GPTFormPage';
import GPTPermissionsPage from './pages/admin/GPTPermissionsPage';
import SettingsView from './pages/settings/SettingsView';

// Rutas protegidas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Rutas de administrador
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return user.role === 'admin' ? children : <Navigate to="/" />;
};

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch, token]);
  
  return (
    <>
      <AlertMessage />
      
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rutas protegidas */}
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/setup-2fa" element={<PrivateRoute><Setup2FAPage /></PrivateRoute>} />
        <Route path="/gpts/:id" element={<PrivateRoute><GPTChatPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsView /></PrivateRoute>} />
        
        {/* Rutas de administrador */}
        <Route path="/admin/gpts" element={<AdminRoute><AdminGPTsPage /></AdminRoute>} />
        <Route path="/admin/gpts/new" element={<AdminRoute><GPTFormPage /></AdminRoute>} />
        <Route path="/admin/gpts/edit/:id" element={<AdminRoute><GPTFormPage /></AdminRoute>} />
        <Route path="/admin/gpts/:id/permissions" element={<AdminRoute><GPTPermissionsPage /></AdminRoute>} />
        
        {/* Ruta por defecto (redirecciona a home) */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;