import React from 'react';
import {
  Drawer,
  List,
  ListItem,
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
import { useEffect } from 'react';
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
    if (window.innerWidth < 960) { // Cierra el sidebar en móviles
      dispatch(toggleSidebar());
    }
  };

  const sidebarContent = (
    <Box sx={{ width: width, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera del Sidebar */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}>
        <Typography variant="h6" component="div">
          Mis GPTs
        </Typography>
        <IconButton
          color="inherit"
          aria-label="close sidebar"
          onClick={() => dispatch(toggleSidebar())}
          sx={{ display: { xs: 'block', md: 'none' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Lista de GPTs */}
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isAuthenticated && (
          <>
            {user?.role === 'admin' && (
              <ListItem
                button={true}
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
              </ListItem>
            )}

            <Divider sx={{ my: 1 }} />

            {loading ? (
              <ListItem>
                <ListItemText primary="Cargando GPTs..." />
              </ListItem>
            ) : (
              gpts.length > 0 ? (
                gpts.map(gpt => (
                  <ListItem
                    button={true}
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
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No hay GPTs disponibles" />
                </ListItem>
              )
            )}
          </>
        )}
      </List>

      {/* Footer del Sidebar */}
      <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <List>
          <ListItem
            button={true}
            onClick={() => handleNavigation('/settings')}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Configuración" />
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Versión móvil */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => dispatch(toggleSidebar())}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Versión desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
          },
        }}
        open
      >
        {sidebarContent}
      </Drawer>
    </>
  );
};

export default Sidebar;