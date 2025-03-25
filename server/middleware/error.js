const errorHandler = (err, req, res, next) => {
    // Log para el desarrollador
    console.error(err);
  
    let error = { ...err };
    error.message = err.message;
  
    // Error de MongoDB para ObjectId incorrecto
    if (err.name === 'CastError') {
      const message = 'Recurso no encontrado';
      error = { message, statusCode: 404 };
    }
  
    // Error de validación de MongoDB
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = { message, statusCode: 400 };
    }
  
    // Error de duplicidad en MongoDB (código 11000)
    if (err.code === 11000) {
      const message = 'Valor duplicado ingresado';
      error = { message, statusCode: 400 };
    }
  
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Error del servidor'
    });
  };
  
  module.exports = errorHandler;