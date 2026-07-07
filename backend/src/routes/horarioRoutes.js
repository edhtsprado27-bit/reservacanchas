const router = require('express').Router();
const { verifyToken, soloAdmin } = require('../middlewares/authMiddleware');
const { pool } = require('../config/database');

router.post('/', verifyToken, soloAdmin, async (req, res, next) => {
  try {
    const { canchaId, fecha, horaInicio, horaFin } = req.body;
    const existe = await pool.query(
      'SELECT id FROM horarios WHERE cancha_id=$1 AND fecha=$2 AND hora_inicio=$3',
      [canchaId, fecha, horaInicio]
    );
    if (existe.rows.length > 0)
      return res.json({ success: true, data: existe.rows[0] });

    const r = await pool.query(
      `INSERT INTO horarios (cancha_id,fecha,hora_inicio,hora_fin)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [canchaId, fecha, horaInicio, horaFin]
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) { next(err); }
});

router.post('/generar', verifyToken, soloAdmin, async (req, res, next) => {
  try {
    const { dias = 14 } = req.body;
    const horas = [
      ['06:00','07:00'],['07:00','08:00'],['08:00','09:00'],
      ['09:00','10:00'],['10:00','11:00'],['11:00','12:00'],
      ['14:00','15:00'],['15:00','16:00'],['16:00','17:00'],
      ['17:00','18:00'],['18:00','19:00'],['19:00','20:00'],
      ['20:00','21:00'],['21:00','22:00']
    ];
    const canchas = await pool.query("SELECT id FROM canchas WHERE estado='activa'");
    let creados = 0;
    for (let d = 0; d < dias; d++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + d);
      const fechaStr = fecha.toISOString().split('T')[0];
      for (const c of canchas.rows) {
        for (const [hi, hf] of horas) {
          const existe = await pool.query(
            'SELECT id FROM horarios WHERE cancha_id=$1 AND fecha=$2 AND hora_inicio=$3',
            [c.id, fechaStr, hi]
          );
          if (existe.rows.length === 0) {
            await pool.query(
              'INSERT INTO horarios (cancha_id,fecha,hora_inicio,hora_fin) VALUES ($1,$2,$3,$4)',
              [c.id, fechaStr, hi, hf]
            );
            creados++;
          }
        }
      }
    }
    res.json({ success: true, message: `✅ ${creados} horarios creados.` });
  } catch (err) { next(err); }
});

module.exports = router;
