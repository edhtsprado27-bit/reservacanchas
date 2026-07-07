const bcrypt = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const usuarioRepo = require('../repositories/usuarioRepository');
const AppError    = require('../utils/AppError');

const registrar = async ({ nombre, apellido, correo, contrasena }) => {
  if (!nombre || !apellido || !correo || !contrasena)
    throw new AppError('Todos los campos son obligatorios.', 400);

  if (contrasena.length < 6)
    throw new AppError('La contraseña debe tener mínimo 6 caracteres.', 400);

  const existente = await usuarioRepo.findByCorreo(correo);
  if (existente) throw new AppError('El correo ya se encuentra registrado.', 409);

  const hash    = await bcrypt.hash(contrasena, 10);
  const usuario = await usuarioRepo.create({ nombre, apellido, correo, contrasena: hash });
  return usuario;
};

const iniciarSesion = async (correo, contrasena) => {
  if (!correo || !contrasena)
    throw new AppError('Correo y contraseña son obligatorios.', 400);

  const usuario = await usuarioRepo.findByCorreo(correo);
  if (!usuario) throw new AppError('Credenciales inválidas.', 401);

  if (usuario.estado === 'suspendido')
    throw new AppError('Cuenta suspendida. Contacte al administrador.', 401);

  const valida = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!valida) throw new AppError('Credenciales inválidas.', 401);

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '8h' }
  );

  const { contrasena: _, ...publico } = usuario;
  return { token, usuario: publico };
};

const getPerfil = async (id) => {
  const usuario = await usuarioRepo.findById(id);
  if (!usuario) throw new AppError('Usuario no encontrado.', 404);
  return usuario;
};

module.exports = { registrar, iniciarSesion, getPerfil };
