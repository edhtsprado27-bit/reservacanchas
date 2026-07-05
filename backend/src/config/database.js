const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'reservacanchas',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

// Si usa Windows Authentication
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  config.options.trustedConnection = true;
  config.driver = 'msnodesqlv8';
} else {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Conectado a SQL Server');
  }
  return pool;
}

module.exports = { getPool, sql };
