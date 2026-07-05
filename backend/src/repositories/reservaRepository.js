const { getPool, sql } = require('../config/database');

const verificarDisponibilidad = async (horarioId) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, horarioId)
    .query("SELECT estado FROM horarios WHERE id = @id");
  return result.recordset[0];
};

const verificarConflictoUsuario = async (usuarioId, fecha, horaInicio, horaFin) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuario_id',  sql.Int,      usuarioId)
    .input('fecha',       sql.Date,     fecha)
    .input('hora_inicio', sql.NVarChar, horaInicio)
    .input('hora_fin',    sql.NVarChar, horaFin)
    .query(`
      SELECT COUNT(*) AS n FROM reservas
      WHERE usuario_id = @usuario_id
        AND fecha = @fecha
        AND estado IN ('pendiente','confirmada')
        AND hora_inicio < @hora_fin
        AND hora_fin > @hora_inicio
    `);
  return result.recordset[0].n;
};

const create = async ({ usuarioId, canchaId, horarioId, fecha, horaInicio, horaFin, monto }) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req = new sql.Request(transaction);
    // Insertar reserva
    const res = await req
      .input('usuario_id',  sql.Int,      usuarioId)
      .input('cancha_id',   sql.Int,      canchaId)
      .input('horario_id',  sql.Int,      horarioId)
      .input('fecha',       sql.Date,     fecha)
      .input('hora_inicio', sql.NVarChar, horaInicio)
      .input('hora_fin',    sql.NVarChar, horaFin)
      .query(`
        INSERT INTO reservas (usuario_id, cancha_id, horario_id, fecha, hora_inicio, hora_fin, estado)
        OUTPUT INSERTED.id
        VALUES (@usuario_id, @cancha_id, @horario_id, @fecha, @hora_inicio, @hora_fin, 'confirmada')
      `);
    const reservaId = res.recordset[0].id;

    // Actualizar horario a reservado
    const req2 = new sql.Request(transaction);
    await req2.input('id', sql.Int, horarioId)
      .query("UPDATE horarios SET estado = 'reservado' WHERE id = @id");

    // Crear pago
    const req3 = new sql.Request(transaction);
    await req3
      .input('reserva_id', sql.Int,     reservaId)
      .input('monto',      sql.Decimal, monto)
      .query("INSERT INTO pagos (reserva_id, monto, estado_pago) VALUES (@reserva_id, @monto, 'pendiente')");

    await transaction.commit();
    return reservaId;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const listarPorUsuario = async (usuarioId) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('usuario_id', sql.Int, usuarioId)
    .query(`
      SELECT r.id, c.nombre AS cancha, c.tipo, r.fecha,
             r.hora_inicio, r.hora_fin, r.estado, r.fecha_reserva,
             p.monto, p.estado_pago
      FROM reservas r
      INNER JOIN canchas c ON r.cancha_id = c.id
      LEFT  JOIN pagos   p ON p.reserva_id = r.id
      WHERE r.usuario_id = @usuario_id
      ORDER BY r.fecha DESC, r.hora_inicio DESC
    `);
  return result.recordset;
};

const listarTodas = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT r.id, u.nombre + ' ' + u.apellido AS usuario, u.correo,
           c.nombre AS cancha, c.tipo, r.fecha,
           r.hora_inicio, r.hora_fin, r.estado, r.fecha_reserva,
           p.monto
    FROM reservas r
    INNER JOIN usuarios u ON r.usuario_id = u.id
    INNER JOIN canchas  c ON r.cancha_id  = c.id
    LEFT  JOIN pagos    p ON p.reserva_id = r.id
    ORDER BY r.fecha_reserva DESC
  `);
  return result.recordset;
};

const findById = async (id) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM reservas WHERE id = @id');
  return result.recordset[0] || null;
};

const cancelar = async (id, motivo) => {
  const pool = await getPool();
  const reserva = await findById(id);
  if (!reserva) return;

  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const req1 = new sql.Request(transaction);
    await req1
      .input('id',     sql.Int,      id)
      .input('motivo', sql.NVarChar, motivo || null)
      .query("UPDATE reservas SET estado = 'cancelada', motivo_cancelacion = @motivo WHERE id = @id");

    const req2 = new sql.Request(transaction);
    await req2
      .input('horario_id', sql.Int, reserva.horario_id)
      .query("UPDATE horarios SET estado = 'disponible' WHERE id = @horario_id");

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const reporteOcupacion = async (desde, hasta) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('desde', sql.Date, desde)
    .input('hasta', sql.Date, hasta)
    .query(`
      SELECT c.nombre AS cancha, c.tipo,
             COUNT(r.id) AS total_reservas,
             SUM(CASE WHEN r.estado = 'confirmada'  THEN 1 ELSE 0 END) AS confirmadas,
             SUM(CASE WHEN r.estado = 'cancelada'   THEN 1 ELSE 0 END) AS canceladas,
             SUM(CASE WHEN r.estado = 'completada'  THEN 1 ELSE 0 END) AS completadas,
             SUM(ISNULL(p.monto, 0)) AS ingresos
      FROM canchas c
      LEFT JOIN reservas r ON r.cancha_id = c.id
        AND r.fecha BETWEEN @desde AND @hasta
      LEFT JOIN pagos p ON p.reserva_id = r.id
      GROUP BY c.id, c.nombre, c.tipo
      ORDER BY total_reservas DESC
    `);
  return result.recordset;
};

module.exports = {
  verificarDisponibilidad, verificarConflictoUsuario,
  create, listarPorUsuario, listarTodas,
  findById, cancelar, reporteOcupacion
};
