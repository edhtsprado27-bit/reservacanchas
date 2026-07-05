const { getPool, sql } = require('../config/database');

const findByCorreo = async (correo) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('correo', sql.NVarChar, correo)
    .query('SELECT * FROM usuarios WHERE correo = @correo');
  return result.recordset[0] || null;
};

const findById = async (id) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id, nombre, apellido, correo, rol, estado, fecha_creacion FROM usuarios WHERE id = @id');
  return result.recordset[0] || null;
};

const create = async ({ nombre, apellido, correo, contrasena, rol = 'usuario' }) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('nombre',    sql.NVarChar, nombre)
    .input('apellido',  sql.NVarChar, apellido)
    .input('correo',    sql.NVarChar, correo)
    .input('contrasena',sql.NVarChar, contrasena)
    .input('rol',       sql.NVarChar, rol)
    .query(`
      INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol)
      OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.apellido,
             INSERTED.correo, INSERTED.rol, INSERTED.estado
      VALUES (@nombre, @apellido, @correo, @contrasena, @rol)
    `);
  return result.recordset[0];
};

const listar = async () => {
  const pool = await getPool();
  const result = await pool.request()
    .query('SELECT id, nombre, apellido, correo, rol, estado, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC');
  return result.recordset;
};

const updateEstado = async (id, estado) => {
  const pool = await getPool();
  await pool.request()
    .input('id',     sql.Int,      id)
    .input('estado', sql.NVarChar, estado)
    .query('UPDATE usuarios SET estado = @estado WHERE id = @id');
};

module.exports = { findByCorreo, findById, create, listar, updateEstado };
