import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Typography, Box, Container } from '@mui/material'

// Componente temporal para la página de inicio
const Home = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          GPT Wrapper App
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Interactúa con GPTs personalizados en un entorno personalizado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Esta aplicación te permite integrar y utilizar GPTs personalizados de OpenAI
          con una interfaz adaptada a tus necesidades.
        </Typography>
      </Box>
    </Container>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Más rutas se agregarán en pasos posteriores */}
    </Routes>
  )
}

export default App