/** @type {import('tailwindcss').Config} */
export default {
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          // Colores inspirados en la interfaz de OpenAI
          primary: {
            light: '#10a37f', // Verde OpenAI
            main: '#10a37f',
            dark: '#0d8c6e',
          },
          background: {
            default: '#ffffff',
            paper: '#f7f7f8',
            sidebar: '#202123',
          },
          text: {
            primary: '#343541', // Color principal de texto en OpenAI
            secondary: '#6e6e80',
            disabled: '#acacbe',
          },
          divider: '#e5e5e5',
          border: '#e5e5e5',
        },
        fontFamily: {
          sans: ['Söhne', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Ubuntu', 'Cantarell', 'Noto Sans', 'sans-serif'],
          mono: ['Söhne Mono', 'Monaco', 'Andale Mono', 'Ubuntu Mono', 'monospace'],
        },
      },
    },
    plugins: [],
    corePlugins: {
      preflight: false, // Desactivar preflight para evitar conflictos con Material UI
    },
  }