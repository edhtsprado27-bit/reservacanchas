const reservaRepo = require('../repositories/reservaRepository');
const canchaRepo  = require('../repositories/canchaRepository');
const AppError    = require('../utils/AppError');

const crear = async ({ usuarioId, canchaId, horarioId, fecha, horaInicio, horaFin }) => {
  // Validar fecha no pasada
  const ahora        = new Date();
  const fechaReserva = new Date(`${fecha}T${horaInicio}`);
  if (fechaReserva <= ahora)
    throw new AppError('No se puede reservar una fecha y hora pasada.', 400);

  // Verificar cancha activa
  const cancha = await canchaRepo.findById(canchaId);
  if (!cancha || cancha.estado !== 'activa')
    throw new AppError('La cancha seleccionada no está disponible.', 409);

  // Verificar horario disponible
  const horario = await reservaRepo.verificarDisponibilidad(horarioId);
  if (!horario || horario.estado !== 'disponible')
    throw new AppError('El horario seleccionado ya no está disponible.', 409);

  // Verificar conflicto del mismo usuario
  const conflicto = await reservaRepo.verificarConflictoUsuario(usuarioId, fecha, horaInicio, horaFin);
  if (conflicto > 0)
    throw new AppError('Ya tienes una reserva activa en ese horario.', 409);

  // Calcular monto
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

  if (reserva.estado === 'cancelada')
    throw new AppError('La reserva ya fue cancelada.', 400);
  if (reserva.estado === 'completada')
    throw new AppError('No se puede cancelar una reserva completada.', 400);

  // Solo el dueño o admin puede cancelar
  if (rol !== 'administrador' && reserva.usuario_id !== usuarioId)
    throw new AppError('No tienes permisos para cancelar esta reserva.', 403);

  // Validar margen de 2 horas (solo usuario)
  if (rol !== 'administrador') {
    const ahora      = new Date();
    const inicioRes  = new Date(`${reserva.fecha.toISOString().split('T')[0]}T${reserva.hora_inicio}`);
    const diferencia = (inicioRes - ahora) / 3600000;
    if (diferencia < 2)
      throw new AppError('No es posible cancelar con menos de 2 horas de anticipación.', 400);
  }

  // Admin requiere motivo
  if (rol === 'administrador' && !motivo)
    throw new AppError('El motivo de cancelación es obligatorio para administradores.', 400);

  await reservaRepo.cancelar(reservaId, motivo);
  return { message: 'Reserva cancelada exitosamente.' };
};

const getHistorial = async (usuarioId) => {
  return await reservaRepo.listarPorUsuario(usuarioId);
};

const getTodas = async () => {
  return await reservaRepo.listarTodas();
};

const getReporte = async (desde, hasta) => {
  return await reservaRepo.reporteOcupacion(desde, hasta);
};

module.exports = { crear, cancelar, getHistorial, getTodas, getReporte };
