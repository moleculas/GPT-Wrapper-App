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
  Box
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import { fetchGPTs } from '../../redux/slices/gptSlice';

const Sidebar = ({ width }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen, darkMode } = useSelector(state => state.ui);
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
        bgcolor: darkMode ? '#202123' : '#f5f5f5',
        boxShadow: 'none',
        position: 'relative',
        borderBottom: darkMode ? '1px solid #444654' : '1px solid #e0e0e0',
      }}>
        {/* Header en blanco */}
      </Box>

      <List sx={{ p: 0 }}>
        {/* Botón de Inicio */}
        <ListItemButton
          onClick={() => handleNavigation('/')}
          sx={{
            '&:hover': { 
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' 
            }
          }}
        >
          <ListItemIcon sx={{ color: darkMode ? '#c5c5d2' : 'inherit' }}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Inicio" 
            primaryTypographyProps={{ 
              sx: { color: darkMode ? '#ffffff' : 'inherit' } 
            }}
          />
        </ListItemButton>

        <Divider sx={{ my: 1, borderColor: darkMode ? '#444654' : '#e0e0e0' }} />

        {/* Título "Mis GPTs" antes del listado */}
        <ListItem sx={{ px: 2, py: 1 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ color: darkMode ? '#c5c5d2' : 'text.secondary' }}
          >
            Mis Asistentes
          </Typography>
        </ListItem>

        {isAuthenticated && (
          <>
            {user?.role === 'admin' && (
              <ListItemButton
                onClick={() => handleNavigation('/admin/gpts/new')}
                sx={{
                  color: 'primary.main',
                  '&:hover': { 
                    backgroundColor: darkMode ? 'rgba(16, 163, 127, 0.12)' : 'rgba(16, 163, 127, 0.04)' 
                  }
                }}
              >
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Nuevo Asistente" />
              </ListItemButton>
            )}

            <Divider sx={{ my: 0, borderColor: darkMode ? '#444654' : '#e0e0e0' }} />

            {loading ? (
              <ListItem sx={{ p: 2 }}>
                <ListItemText 
                  primary="Cargando GPTs..." 
                  primaryTypographyProps={{ 
                    sx: { color: darkMode ? '#c5c5d2' : 'inherit' } 
                  }}
                />
              </ListItem>
            ) : (
              gpts.length > 0 ? (
                gpts.map(gpt => (
                  <ListItemButton
                    key={gpt._id}
                    onClick={() => handleNavigation(`/gpts/${gpt._id}`)}
                    sx={{
                      py: 1.5,
                      pl: 2,
                      pr: 1,
                      display: 'flex',
                      alignItems: 'flex-start',
                      '&:hover': { 
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' 
                      }
                    }}
                  >
                    <ChatIcon
                      color="primary"
                      sx={{
                        fontSize: 20,
                        mt: 0.5,
                        mr: 1.5,
                        minWidth: 20
                      }}
                    />
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          lineHeight: 1.3,
                          mb: 0.6,
                          overflow: 'hidden',
                          color: darkMode ? '#ffffff' : 'inherit'
                        }}
                      >
                        {gpt.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: darkMode ? '#c5c5d2' : 'text.secondary'
                        }}
                      >
                        {gpt.description}
                      </Typography>
                    </Box>
                  </ListItemButton>
                ))
              ) : (
                <ListItem sx={{ p: 2 }}>
                  <ListItemText 
                    primary="No hay GPTs disponibles" 
                    primaryTypographyProps={{ 
                      sx: { color: darkMode ? '#c5c5d2' : 'inherit' } 
                    }}
                  />
                </ListItem>
              )
            )}
          </>
        )}
      </List>

      {/* Espaciador flexible para empujar el botón de configuración al fondo */}
      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ borderTop: darkMode ? '1px solid #444654' : '1px solid #e0e0e0' }}>
        <ListItemButton
          onClick={() => handleNavigation('/settings')}
          sx={{
            '&:hover': { 
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' 
            }
          }}
        >
          <ListItemIcon sx={{ color: darkMode ? '#c5c5d2' : 'inherit' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Configuración" 
            primaryTypographyProps={{ 
              sx: { color: darkMode ? '#ffffff' : 'inherit' } 
            }}
          />
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
            bgcolor: darkMode ? '#202123' : '#f5f5f5',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRight: darkMode ? '1px solid #444654' : '1px solid #e0e0e0',
          },
        }}
        className="sidebar"
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
            bgcolor: darkMode ? '#202123' : '#f5f5f5',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRight: darkMode ? '1px solid #444654' : '1px solid #e0e0e0',
          },
        }}
        className="sidebar"
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Sidebar;