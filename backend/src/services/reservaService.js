const reservaRepo = require('../repositories/reservaRepository');
const canchaRepo  = require('../repositories/canchaRepository');
const AppError    = require('../utils/AppError');
const { pool }    = require('../config/database');

const crear = async ({ usuarioId, canchaId, horarioId, fecha, horaInicio, horaFin }) => {
  const ahora        = new Date();
  const fechaReserva = new Date(`${fecha}T${horaInicio}`);
  if (fechaReserva <= ahora)
    throw new AppError('No se puede reservar una fecha y hora pasada.', 400);

  const cancha = await canchaRepo.findById(canchaId);
  if (!cancha || cancha.estado !== 'activa')
    throw new AppError('La cancha seleccionada no está disponible.', 409);

  const horResult = await pool.query('SELECT estado FROM horarios WHERE id=$1', [horarioId]);
  const horario   = horResult.rows[0];
  if (!horario || horario.estado !== 'disponible')
    throw new AppError('El horario seleccionado ya no está disponible.', 409);

  const conflicto = await reservaRepo.verificarConflictoUsuario(usuarioId, fecha, horaInicio, horaFin);
  if (conflicto > 0)
    throw new AppError('Ya tienes una reserva activa en ese horario.', 409);

  const ini   = new Date(`1970-01-01T${horaInicio}`);
  const fin   = new Date(`1970-01-01T${horaFin}`);
  const horas = (fin - ini) / 3600000;
  const monto = parseFloat(cancha.precio_hora) * horas;

  const reservaId = await reservaRepo.create({ usuarioId, canchaId, horarioId, fecha, horaInicio, horaFin, monto });
  return { id: reservaId, estado: 'confirmada', monto };
};

const cancelar = async (reservaId, usuarioId, rol, motivo) => {
  const reserva = await reservaRepo.findById(reservaId);
  if (!reserva) throw new AppError('Reserva no encontrada.', 404);
  if (reserva.estado === 'cancelada')   throw new AppError('La reserva ya fue cancelada.', 400);
  if (reserva.estado === 'completada')  throw new AppError('No se puede cancelar una reserva completada.', 400);
  if (rol !== 'administrador' && reserva.usuario_id !== parseInt(usuarioId))
    throw new AppError('No tienes permisos para cancelar esta reserva.', 403);
  if (rol !== 'administrador') {
    const fechaStr  = String(reserva.fecha).split('T')[0];
    const horaStr   = String(reserva.hora_inicio).substring(0,5);
    const inicioRes = new Date(`${fechaStr}T${horaStr}`);
    if ((inicioRes - new Date()) / 3600000 < 2)
      throw new AppError('No es posible cancelar con menos de 2 horas de anticipación.', 400);
  }
  if (rol === 'administrador' && !motivo)
    throw new AppError('El motivo de cancelación es obligatorio para administradores.', 400);
  await reservaRepo.cancelar(reservaId, motivo);
  return { message: 'Reserva cancelada exitosamente.' };
};

const getHistorial = async (id) => reservaRepo.listarPorUsuario(id);
const getTodas     = async ()    => reservaRepo.listarTodas();
const getReporte   = async (d,h) => reservaRepo.reporteOcupacion(d,h);

module.exports = { crear, cancelar, getHistorial, getTodas, getReporte };
