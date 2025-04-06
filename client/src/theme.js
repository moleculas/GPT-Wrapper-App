import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#10a37f',
      light: '#34b79a',
      dark: '#0d8c6e',
      contrastText: '#fff',
    },
    secondary: {
      main: '#6e6e80',
      light: '#8e8ea0',
      dark: '#4b4b63',
      contrastText: '#fff',
    },
    background: {
      default: '#f9f9f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#343541',
      secondary: '#6e6e80',
      disabled: '#acacbe',
    },
    divider: '#e0e0e0',
    error: {
      main: '#ef4146',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2e7daf',
    },
    success: {
      main: '#10a37f',
    },
  },
  typography: {
    fontFamily: [
      'Söhne',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f9f9f9',
          color: '#343541',
          transition: 'background-color 0.3s, color 0.3s',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#343541',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          transition: 'background-color 0.3s, color 0.3s',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e0e0e0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'inherit',
          '&.MuiIconButton-colorError': {
            color: '#ef4146',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
        },
        containedPrimary: {
          backgroundColor: '#10a37f',
          '&:hover': {
            backgroundColor: '#0d8c6e',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: '#e0e0e0',
          '&.Mui-checked': {
            color: '#10a37f',
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#10a37f',
          },
        },
        track: {
          backgroundColor: '#e0e0e0',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10a37f',
      light: '#34b79a',
      dark: '#0d8c6e',
      contrastText: '#fff',
    },
    secondary: {
      main: '#6e6e80',
      light: '#8e8ea0',
      dark: '#4b4b63',
      contrastText: '#fff',
    },
    background: {
      default: '#202123',
      paper: '#343541',
    },
    text: {
      primary: '#ffffff',
      secondary: '#c5c5d2',
      disabled: '#8e8ea0',
    },
    divider: '#444654',
    error: {
      main: '#ef4146',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2e7daf',
    },
    success: {
      main: '#10a37f',
    },
  },
  typography: {
    fontFamily: [
      'Söhne',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#202123',
          color: '#ffffff',
          transition: 'background-color 0.3s, color 0.3s',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#202123',
          color: '#ffffff',
          borderBottom: '1px solid #444654',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#343541',
          transition: 'background-color 0.3s, color 0.3s',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#202123',
          borderRight: '1px solid #444654',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#444654',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#c5c5d2',
          '&.MuiIconButton-colorError': {
            color: '#ef4146',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
        },
        containedPrimary: {
          backgroundColor: '#10a37f',
          '&:hover': {
            backgroundColor: '#0d8c6e',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: '#10a37f',
          '&.Mui-checked': {
            color: '#10a37f',
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#10a37f',
          },
        },
        track: {
          backgroundColor: '#444654',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#444654',
        },
      },
    },
  },
});

const getTheme = (mode) => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

export default getTheme;

export { lightTheme, darkTheme };