import { createTheme } from '@mui/material/styles';

// Crear tema personalizado inspirado en la interfaz de OpenAI
const theme = createTheme({
  palette: {
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
      default: '#ffffff',
      paper: '#f7f7f8',
    },
    text: {
      primary: '#343541',
      secondary: '#6e6e80',
      disabled: '#acacbe',
    },
    divider: '#e5e5e5',
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
      textTransform: 'none', // Mantener capitalización original (como OpenAI)
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(to bottom, #1caa82, #10a37f)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

export default theme;