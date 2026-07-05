require('dotenv').config();
const app        = require('./src/app');
const { getPool } = require('./src/config/database');

const PORT = process.env.PORT || 3001;

async function iniciar() {
  try {
    await getPool(); // Verificar conexión a SQL Server
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📋 API disponible en http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Error al conectar con SQL Server:', err.message);
    process.exit(1);
  }
}

iniciar();
