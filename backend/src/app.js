const express         = require('express');
const cors            = require('cors');
const errorMiddleware = require('./middlewares/errorMiddleware');

const authRoutes    = require('./routes/authRoutes');
const canchaRoutes  = require('./routes/canchaRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const horarioRoutes = require('./routes/horarioRoutes');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/canchas',  canchaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/horarios', horarioRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🚀 API funcionando correctamente' });
});

app.use(errorMiddleware);

module.exports = app;
