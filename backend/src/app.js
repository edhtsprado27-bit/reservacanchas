const express        = require('express');
const cors           = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware');

const authRoutes    = require('./routes/authRoutes');
const canchaRoutes  = require('./routes/canchaRoutes');
const reservaRoutes = require('./routes/reservaRoutes');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Rutas
app.use('/api/auth',     authRoutes);
app.use('/api/canchas',  canchaRoutes);
app.use('/api/reservas', reservaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API funcionando correctamente 🚀' });
});

// Manejo de errores
app.use(errorMiddleware);

module.exports = app;
