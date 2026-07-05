const { getPool, sql } = require('../config/database');

const listar = async (tipo) => {
  const pool = await getPool();
  const req  = pool.request();
  let query  = "SELECT * FROM canchas WHERE estado = 'activa'";
  if (tipo && tipo !== 'todos') {
    query += ' AND tipo = @tipo';
    req.input('tipo', sql.NVarChar, tipo);
  }
  query += ' ORDER BY tipo, nombre';
  const result = await req.query(query);
  return result.recordset;
};

const findById = async (id) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM canchas WHERE id = @id');
  return result.recordset[0] || null;
};

const create = async ({ nombre, tipo, ubicacion, precio_hora }) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('nombre',      sql.NVarChar,  nombre)
    .input('tipo',        sql.NVarChar,  tipo)
    .input('ubicacion',   sql.NVarChar,  ubicacion)
    .input('precio_hora', sql.Decimal,   precio_hora)
    .query(`
      INSERT INTO canchas (nombre, tipo, ubicacion, precio_hora)
      OUTPUT INSERTED.*
      VALUES (@nombre, @tipo, @ubicacion, @precio_hora)
    `);
  return result.recordset[0];
};

const update = async (id, datos) => {
  const pool = await getPool();
  await pool.request()
    .input('id',          sql.Int,      id)
    .input('nombre',      sql.NVarChar, datos.nombre)
    .input('tipo',        sql.NVarChar, datos.tipo)
    .input('ubicacion',   sql.NVarChar, datos.ubicacion)
    .input('precio_hora', sql.Decimal,  datos.precio_hora)
    .input('estado',      sql.NVarChar, datos.estado)
    .query(`
      UPDATE canchas SET
        nombre = @nombre, tipo = @tipo, ubicacion = @ubicacion,
        precio_hora = @precio_hora, estado = @estado
      WHERE id = @id
    `);
};

const getHorarios = async (canchaId, fecha) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('cancha_id', sql.Int,  canchaId)
    .input('fecha',     sql.Date, fecha)
    .query(`
      SELECT * FROM horarios
      WHERE cancha_id = @cancha_id AND fecha = @fecha
      ORDER BY hora_inicio
    `);
  return result.recordset;
};

module.exports = { listar, findById, create, update, getHorarios };
