import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Nuevo icono para administración
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar, toggleDarkMode } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ sidebarWidth }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode, sidebarOpen } = useSelector(state => state.ui);
  const { user, isAuthenticated } = useSelector(state => state.auth);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid #e0e0e0',
        boxShadow: 'none',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: { xs: '100%', md: sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : '100%' },
        ml: { xs: 0, md: sidebarOpen ? `${sidebarWidth}px` : 0 },
        transition: (theme) => theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => { dispatch(toggleSidebar()); }}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Título clickeable para ir a Inicio */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer' 
          }}
          onClick={() => navigate('/')}
        >
          GPT Wrapper
        </Typography>

        {/* Iconos de navegación rápida - visible solo en desktop */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <Tooltip title="Inicio">
            <IconButton
              color="inherit"
              onClick={() => navigate('/')}
            >
              <HomeIcon />
            </IconButton>
          </Tooltip>
          
          {/* Nuevo icono de administración - solo visible para admins */}
          {isAuthenticated && user?.role === 'admin' && (
            <Tooltip title="Administración">
              <IconButton
                color="inherit"
                onClick={() => navigate('/admin/gpts')}
              >
                <AdminPanelSettingsIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {isAuthenticated && (
            <Tooltip title="Configuración">
              <IconButton
                color="inherit"
                onClick={() => navigate('/settings')}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={darkMode ? "Modo claro" : "Modo oscuro"}>
            <IconButton
              color="inherit"
              onClick={() => dispatch(toggleDarkMode())}
              sx={{ mr: 1 }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {isAuthenticated ? (
          <Box>
            <Tooltip title="Cuenta">
              <IconButton
                onClick={handleClick}
                sx={{ p: 0 }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar alt={user?.name} src="/static/images/avatar/1.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              id="account-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'account-button',
              }}
            >
              <MenuItem onClick={handleProfile}>Perfil</MenuItem>
              <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button color="inherit" onClick={() => navigate('/login')}>Iniciar sesión</Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;