const usuarioService = require('../services/usuarioService');

const register = async (req, res, next) => {
  try {
    const usuario = await usuarioService.registrar(req.body);
    res.status(201).json({ success: true, message: 'Usuario registrado exitosamente.', data: usuario });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;
    const result = await usuarioService.iniciarSesion(correo, contrasena);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

const perfil = async (req, res, next) => {
  try {
    const usuario = await usuarioService.getPerfil(req.usuario.id);
    res.status(200).json({ success: true, data: usuario });
  } catch (err) { next(err); }
};

module.exports = { register, login, perfil };
