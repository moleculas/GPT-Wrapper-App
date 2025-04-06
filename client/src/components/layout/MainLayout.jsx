import React, { useEffect, useState } from 'react';
import { Box, Container, useMediaQuery, useTheme } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSelector, useDispatch } from 'react-redux';
import { setSidebarOpen } from '../../redux/slices/uiSlice';

const MainLayout = ({ children }) => {
  const { sidebarOpen, darkMode } = useSelector(state => state.ui);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useDispatch();
  const [userToggled, setUserToggled] = useState(false);
  
  const handleToggle = () => {
    setUserToggled(true);
    dispatch(setSidebarOpen(!sidebarOpen));
  };
  
  useEffect(() => {
    if (!userToggled) {
      dispatch(setSidebarOpen(isDesktop));
    }
  }, [dispatch, userToggled, isDesktop]);
  
  useEffect(() => {
    const handleResize = () => {
      if (!userToggled) {
        dispatch(setSidebarOpen(isDesktop));
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch, userToggled, isDesktop]);
  
  const sidebarWidth = 280;
  const navbarHeight = 64;
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        backgroundColor: darkMode ? '#202123' : '#f9f9f9',
        color: darkMode ? '#ffffff' : '#343541',
        transition: 'background-color 0.3s, color 0.3s'
      }}
      className={darkMode ? 'dark-mode' : 'light-mode'}
    >
      <Navbar sidebarWidth={sidebarWidth} handleToggle={handleToggle} />
      
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
            py: 0,
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