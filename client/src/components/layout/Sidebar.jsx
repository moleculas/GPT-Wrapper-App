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
      <Box sx={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',       
        bgcolor: '#f5f5f5',
        boxShadow: 'none',
        position: 'relative'
      }}>
        <Typography variant="h6" component="div" sx={{ px: 2 }}>
          Mis GPTs
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, p: 0 }}>
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
            boxShadow: 'none'
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
            boxShadow: 'none'
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Sidebar;