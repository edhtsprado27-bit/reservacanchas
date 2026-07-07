const { pool } = require('../config/database');

const verificarDisponibilidad = async (horarioId) => {
  const r = await pool.query('SELECT estado FROM horarios WHERE id=$1', [horarioId]);
  return r.rows[0];
};

const verificarConflictoUsuario = async (usuarioId, fecha, horaInicio, horaFin) => {
  const r = await pool.query(
    `SELECT COUNT(*) AS n FROM reservas
     WHERE usuario_id=$1 AND fecha=$2
     AND estado IN ('pendiente','confirmada')
     AND hora_inicio < $3 AND hora_fin > $4`,
    [usuarioId, fecha, horaFin, horaInicio]
  );
  return parseInt(r.rows[0].n);
};

const create = async ({ usuarioId, canchaId, horarioId, fecha, horaInicio, horaFin, monto }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(
      `INSERT INTO reservas (usuario_id,cancha_id,horario_id,fecha,hora_inicio,hora_fin,estado)
       VALUES ($1,$2,$3,$4,$5,$6,'confirmada') RETURNING id`,
      [usuarioId, canchaId, horarioId, fecha, horaInicio, horaFin]
    );
    const reservaId = res.rows[0].id;
    await client.query("UPDATE horarios SET estado='reservado' WHERE id=$1", [horarioId]);
    await client.query(
      "INSERT INTO pagos (reserva_id,monto,estado_pago) VALUES ($1,$2,'pendiente')",
      [reservaId, monto || 0]
    );
    await client.query('COMMIT');
    return reservaId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
};

const listarPorUsuario = async (usuarioId) => {
  const r = await pool.query(
    `SELECT r.id, c.nombre AS cancha, c.tipo,
            r.fecha::TEXT AS fecha,
            TO_CHAR(r.hora_inicio,'HH24:MI') AS hora_inicio,
            TO_CHAR(r.hora_fin,   'HH24:MI') AS hora_fin,
            r.estado, r.fecha_reserva,
            p.monto, p.estado_pago
     FROM reservas r
     INNER JOIN canchas c ON r.cancha_id=c.id
     LEFT  JOIN pagos   p ON p.reserva_id=r.id
     WHERE r.usuario_id=$1
     ORDER BY r.fecha DESC, r.hora_inicio DESC`,
    [usuarioId]
  );
  return r.rows;
};

const listarTodas = async () => {
  const r = await pool.query(`
    SELECT r.id,
           u.nombre||' '||u.apellido AS usuario, u.correo,
           c.nombre AS cancha, c.tipo,
           r.fecha::TEXT AS fecha,
           TO_CHAR(r.hora_inicio,'HH24:MI') AS hora_inicio,
           TO_CHAR(r.hora_fin,   'HH24:MI') AS hora_fin,
           r.estado, r.fecha_reserva, r.motivo_cancelacion,
           p.monto
    FROM reservas r
    INNER JOIN usuarios u ON r.usuario_id=u.id
    INNER JOIN canchas  c ON r.cancha_id=c.id
    LEFT  JOIN pagos    p ON p.reserva_id=r.id
    ORDER BY r.fecha_reserva DESC
  `);
  return r.rows;
};

const findById = async (id) => {
  const r = await pool.query('SELECT * FROM reservas WHERE id=$1', [id]);
  return r.rows[0] || null;
};

const cancelar = async (id, motivo) => {
  const reserva = await findById(id);
  if (!reserva) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      "UPDATE reservas SET estado='cancelada', motivo_cancelacion=$1 WHERE id=$2",
      [motivo || null, id]
    );
    await client.query(
      "UPDATE horarios SET estado='disponible' WHERE id=$1",
      [reserva.horario_id]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
};

const actualizar = async (id, { fecha, hora_inicio, hora_fin, estado }) => {
  await pool.query(
    'UPDATE reservas SET fecha=$1,hora_inicio=$2,hora_fin=$3,estado=$4 WHERE id=$5',
    [fecha, hora_inicio, hora_fin, estado, id]
  );
};

const reporteOcupacion = async (desde, hasta) => {
  const r = await pool.query(
    `SELECT c.nombre AS cancha, c.tipo,
            COUNT(r.id) AS total_reservas,
            SUM(CASE WHEN r.estado='confirmada' THEN 1 ELSE 0 END) AS confirmadas,
            SUM(CASE WHEN r.estado='cancelada'  THEN 1 ELSE 0 END) AS canceladas,
            SUM(COALESCE(p.monto,0)) AS ingresos
     FROM canchas c
     LEFT JOIN reservas r ON r.cancha_id=c.id
       AND r.fecha BETWEEN $1 AND $2
       AND r.estado IN ('confirmada','completada')
     LEFT JOIN pagos p ON p.reserva_id=r.id
     GROUP BY c.id,c.nombre,c.tipo
     ORDER BY total_reservas DESC`,
    [desde, hasta]
  );
  return r.rows;
};

const reporteIngresos = async () => {
  const hoy = await pool.query(`
    SELECT COUNT(r.id) AS reservas, SUM(COALESCE(p.monto,0)) AS total
    FROM reservas r LEFT JOIN pagos p ON p.reserva_id=r.id
    WHERE r.fecha=CURRENT_DATE AND r.estado IN ('confirmada','completada')
  `);
  const semana = await pool.query(`
    SELECT COUNT(r.id) AS reservas, SUM(COALESCE(p.monto,0)) AS total
    FROM reservas r LEFT JOIN pagos p ON p.reserva_id=r.id
    WHERE r.fecha >= DATE_TRUNC('week', CURRENT_DATE)
      AND r.fecha <= CURRENT_DATE
      AND r.estado IN ('confirmada','completada')
  `);
  const mes = await pool.query(`
    SELECT COUNT(r.id) AS reservas, SUM(COALESCE(p.monto,0)) AS total
    FROM reservas r LEFT JOIN pagos p ON p.reserva_id=r.id
    WHERE EXTRACT(MONTH FROM r.fecha)=EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR  FROM r.fecha)=EXTRACT(YEAR  FROM CURRENT_DATE)
      AND r.estado IN ('confirmada','completada')
  `);
  const porDia = await pool.query(`
    SELECT r.fecha::TEXT AS fecha,
           TO_CHAR(r.fecha,'Day') AS dia_nombre,
           COUNT(r.id) AS reservas,
           SUM(COALESCE(p.monto,0)) AS total
    FROM reservas r LEFT JOIN pagos p ON p.reserva_id=r.id
    WHERE r.fecha >= CURRENT_DATE - 6
      AND r.estado IN ('confirmada','completada')
    GROUP BY r.fecha ORDER BY r.fecha ASC
  `);
  const porSemana = await pool.query(`
    SELECT EXTRACT(WEEK FROM r.fecha) AS semana_num,
           MIN(r.fecha)::TEXT AS inicio_semana,
           COUNT(r.id) AS reservas,
           SUM(COALESCE(p.monto,0)) AS total
    FROM reservas r LEFT JOIN pagos p ON p.reserva_id=r.id
    WHERE r.fecha >= CURRENT_DATE - 28
      AND r.estado IN ('confirmada','completada')
    GROUP BY EXTRACT(WEEK FROM r.fecha), EXTRACT(YEAR FROM r.fecha)
    ORDER BY semana_num ASC
  `);
  const porMes = await pool.query(`
    SELECT EXTRACT(YEAR  FROM r.fecha) AS anio,
           EXTRACT(MONTH FROM r.fecha) AS mes_num,
           TO_CHAR(MIN(r.fecha),'Month') AS mes_nombre,
           COUNT(r.id) AS reservas,
           SUM(COALESCE(p.monto,0)) AS total
    FROM reservas r LEFT JOIN pagos p ON p.reserva_id=r.id
    WHERE r.fecha >= CURRENT_DATE - INTERVAL '6 months'
      AND r.estado IN ('confirmada','completada')
    GROUP BY EXTRACT(YEAR FROM r.fecha), EXTRACT(MONTH FROM r.fecha)
    ORDER BY anio ASC, mes_num ASC
  `);
  return {
    resumen: { hoy: hoy.rows[0], semana: semana.rows[0], mes: mes.rows[0] },
    porDia:    porDia.rows,
    porSemana: porSemana.rows,
    porMes:    porMes.rows,
  };
};

module.exports = {
  verificarDisponibilidad, verificarConflictoUsuario,
  create, listarPorUsuario, listarTodas,
  findById, cancelar, actualizar,
  reporteOcupacion, reporteIngresos
};
