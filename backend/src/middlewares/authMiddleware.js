const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError('Token no proporcionado. Acceso denegado.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return next(new AppError('Token inválido o expirado.', 401));
  }
};

const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return next(new AppError('No tienes permisos para acceder a este recurso.', 403));
  }
  next();
};

module.exports = { verifyToken, soloAdmin };
