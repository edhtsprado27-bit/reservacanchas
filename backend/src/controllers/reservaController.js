const reservaService = require('../services/reservaService');

const crear = async (req, res, next) => {
  try {
    const { canchaId, horarioId, fecha, horaInicio, horaFin } = req.body;
    const result = await reservaService.crear({
      usuarioId: req.usuario.id, canchaId, horarioId, fecha, horaInicio, horaFin
    });
    res.status(201).json({ success: true, message: 'Reserva confirmada exitosamente.', data: result });
  } catch (err) { next(err); }
};

const cancelar = async (req, res, next) => {
  try {
    const result = await reservaService.cancelar(
      req.params.id, req.usuario.id, req.usuario.rol, req.body.motivo
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const historial = async (req, res, next) => {
  try {
    const reservas = await reservaService.getHistorial(req.usuario.id);
    res.json({ success: true, data: reservas });
  } catch (err) { next(err); }
};

const todas = async (req, res, next) => {
  try {
    const reservas = await reservaService.getTodas();
    res.json({ success: true, data: reservas });
  } catch (err) { next(err); }
};

const reporte = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta)
      return res.status(400).json({ success: false, message: 'Se requiere desde y hasta.' });
    const data = await reservaService.getReporte(desde, hasta);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { crear, cancelar, historial, todas, reporte };
