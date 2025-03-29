import React, { useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import { fetchGPTs } from '../../redux/slices/gptSlice';

const Sidebar = ({ width }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen } = useSelector(state => state.ui);
  const { gpts, loading } = useSelector(state => state.gpts);
  const { isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchGPTs());
    }
  }, [dispatch, isAuthenticated]);

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 960) {
      dispatch(toggleSidebar());
    }
  };

  const sidebarContent = (
    <>
      {/* Header vacío con border-bottom */}
      <Box sx={{
        height: '65px',
        display: 'flex',
        alignItems: 'center',       
        bgcolor: '#f5f5f5',
        boxShadow: 'none',
        position: 'relative',
        borderBottom: '1px solid #e0e0e0',
      }}>
        {/* Header en blanco */}
      </Box>

      <List sx={{ p: 0 }}>
        {/* Botón de Inicio */}
        <ListItemButton
          onClick={() => handleNavigation('/')}
          sx={{
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
          }}
        >
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Inicio" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Título "Mis GPTs" antes del listado */}
        <ListItem sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Mis GPTs
          </Typography>
        </ListItem>

        {isAuthenticated && (
          <>
            {user?.role === 'admin' && (
              <ListItemButton
                onClick={() => handleNavigation('/admin/gpts/new')}
                sx={{
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'rgba(16, 163, 127, 0.04)' }
                }}
              >
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Nuevo GPT" />
              </ListItemButton>
            )}

            <Divider sx={{ my: 0 }} />

            {loading ? (
              <ListItem sx={{ p: 2 }}>
                <ListItemText primary="Cargando GPTs..." />
              </ListItem>
            ) : (
              gpts.length > 0 ? (
                gpts.map(gpt => (
                  <ListItemButton
                    key={gpt._id}
                    onClick={() => handleNavigation(`/gpts/${gpt._id}`)}
                  >
                    <ListItemIcon>
                      <ChatIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={gpt.name}
                      secondary={gpt.description.length > 30
                        ? `${gpt.description.substring(0, 30)}...`
                        : gpt.description}
                    />
                  </ListItemButton>
                ))
              ) : (
                <ListItem sx={{ p: 2 }}>
                  <ListItemText primary="No hay GPTs disponibles" />
                </ListItem>
              )
            )}
          </>
        )}
      </List>

      {/* Espaciador flexible para empujar el botón de configuración al fondo */}
      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ borderTop: '1px solid #e0e0e0' }}>
        <ListItemButton
          onClick={() => handleNavigation('/settings')}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Configuración" />
        </ListItemButton>
      </Box>
    </>
  );

  return (
    <>
      {/* Drawer para móvil - siempre temporal */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => dispatch(toggleSidebar())}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: width,
            bgcolor: '#f5f5f5',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          },
        }}
      >
        {sidebarContent}
      </Drawer>
      
      {/* Drawer para desktop - su visibilidad se controla por el estado */}
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: width,
            bgcolor: '#f5f5f5',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Sidebar;