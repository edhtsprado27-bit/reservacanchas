const canchaRepo = require('../repositories/canchaRepository');

const listar = async (req, res, next) => {
  try {
    const canchas = await canchaRepo.listar(req.query.tipo);
    res.json({ success: true, data: canchas });
  } catch (err) { next(err); }
};

const getHorarios = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ success: false, message: 'La fecha es requerida.' });
    const horarios = await canchaRepo.getHorarios(id, fecha);
    res.json({ success: true, data: horarios });
  } catch (err) { next(err); }
};

const crear = async (req, res, next) => {
  try {
    const cancha = await canchaRepo.create(req.body);
    res.status(201).json({ success: true, data: cancha });
  } catch (err) { next(err); }
};

const actualizar = async (req, res, next) => {
  try {
    await canchaRepo.update(req.params.id, req.body);
    res.json({ success: true, message: 'Cancha actualizada correctamente.' });
  } catch (err) { next(err); }
};

module.exports = { listar, getHorarios, crear, actualizar };
