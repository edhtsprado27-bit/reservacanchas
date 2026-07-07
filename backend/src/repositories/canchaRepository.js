const { pool } = require('../config/database');

const listar = async (tipo) => {
  let q = "SELECT * FROM canchas WHERE estado='activa'";
  const params = [];
  if (tipo && tipo !== 'todos') { q += ' AND tipo=$1'; params.push(tipo); }
  q += ' ORDER BY tipo,nombre';
  const r = await pool.query(q, params);
  return r.rows;
};

const findById = async (id) => {
  const r = await pool.query('SELECT * FROM canchas WHERE id=$1', [id]);
  return r.rows[0] || null;
};

const create = async ({ nombre, tipo, ubicacion, precio_hora }) => {
  const r = await pool.query(
    'INSERT INTO canchas (nombre,tipo,ubicacion,precio_hora) VALUES ($1,$2,$3,$4) RETURNING *',
    [nombre, tipo, ubicacion, precio_hora]
  );
  return r.rows[0];
};

const update = async (id, { nombre, tipo, ubicacion, precio_hora, estado }) => {
  await pool.query(
    'UPDATE canchas SET nombre=$1,tipo=$2,ubicacion=$3,precio_hora=$4,estado=$5 WHERE id=$6',
    [nombre, tipo, ubicacion, precio_hora, estado, id]
  );
};

const getHorarios = async (canchaId, fecha) => {
  const r = await pool.query(
    `SELECT id, cancha_id, fecha,
            TO_CHAR(hora_inicio,'HH24:MI') AS hora_inicio,
            TO_CHAR(hora_fin,   'HH24:MI') AS hora_fin,
            estado
     FROM horarios
     WHERE cancha_id=$1 AND fecha=$2
     ORDER BY hora_inicio`,
    [canchaId, fecha]
  );
  return r.rows;
};

module.exports = { listar, findById, create, update, getHorarios };
