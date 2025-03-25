import React from 'react';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';

const MainLayout = ({ children }) => {
  const { sidebarOpen } = useSelector(state => state.ui);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sidebarWidth = 280;

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Sidebar width={sidebarWidth} />

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
          ml: { xs: 0, md: `${sidebarWidth}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(sidebarOpen && {
            width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
            ml: { xs: 0, md: `${sidebarWidth}px` },
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Navbar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;