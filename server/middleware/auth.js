const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      console.log('Auth header encontrado:', req.headers.authorization);
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('No token encontrado en la solicitud');
      return res.status(401).json({
        success: false,
        error: 'No estás autorizado para acceder a esta ruta'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verificado correctamente para usuario ID:', decoded.id);

      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('Usuario no encontrado con ID:', decoded.id);
        return res.status(401).json({
          success: false,
          error: 'El usuario ya no existe en el sistema'
        });
      }

      req.user = user;
      next();
    } catch (err) {
      console.log('Error al verificar token:', err.message);
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }
  } catch (err) {
    console.error('Error general en middleware protect:', err);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor en autenticación'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('Intento de autorizar sin usuario en request');
      return res.status(500).json({
        success: false,
        error: 'Error de configuración de autenticación'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`Usuario con rol ${req.user.role} intentó acceder a ruta restringida para ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
    }
    next();
  };
};