import React, { useEffect } from 'react';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSelector, useDispatch } from 'react-redux';
import { setSidebarOpen } from '../../redux/slices/uiSlice';

const MainLayout = ({ children }) => {
  const { sidebarOpen } = useSelector(state => state.ui);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useDispatch();

  // Este efecto maneja el redimensionamiento de la ventana
  useEffect(() => {
    const handleResize = () => {
      const isDesktopNow = window.innerWidth >= 960;
      // En escritorio, siempre abrimos el sidebar si está cerrado
      if (isDesktopNow && !sidebarOpen) {
        dispatch(setSidebarOpen(true));
      }
    };

    // Ejecutar una vez al iniciar para asegurar el estado correcto
    handleResize();

    // Escuchar cambios de tamaño de pantalla
    window.addEventListener('resize', handleResize);
    
    // Limpiar el listener cuando el componente se desmonte
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch, sidebarOpen]);

  const sidebarWidth = 280;
  const navbarHeight = 64;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <Navbar sidebarWidth={sidebarWidth} />
      
      <Sidebar width={sidebarWidth} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          ml: { 
            xs: 0, 
            md: sidebarOpen ? `${sidebarWidth}px` : 0 
          },
          mt: `${navbarHeight}px`,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container 
          maxWidth="xl" 
          sx={{
            py: 3,
            height: `calc(100vh - ${navbarHeight}px - 24px)`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;