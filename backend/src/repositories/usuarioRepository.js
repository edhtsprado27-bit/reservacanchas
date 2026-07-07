const { pool } = require('../config/database');

const findByCorreo = async (correo) => {
  const r = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
  return r.rows[0] || null;
};

const findById = async (id) => {
  const r = await pool.query(
    'SELECT id,nombre,apellido,correo,rol,estado,fecha_creacion FROM usuarios WHERE id=$1', [id]
  );
  return r.rows[0] || null;
};

const create = async ({ nombre, apellido, correo, contrasena, rol='usuario' }) => {
  const r = await pool.query(
    `INSERT INTO usuarios (nombre,apellido,correo,contrasena,rol)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id,nombre,apellido,correo,rol,estado`,
    [nombre, apellido, correo, contrasena, rol]
  );
  return r.rows[0];
};

const listar = async () => {
  const r = await pool.query(
    'SELECT id,nombre,apellido,correo,rol,estado,fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC'
  );
  return r.rows;
};

const updateEstado = async (id, estado) => {
  await pool.query('UPDATE usuarios SET estado=$1 WHERE id=$2', [estado, id]);
};

module.exports = { findByCorreo, findById, create, listar, updateEstado };
