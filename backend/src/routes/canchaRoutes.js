const router = require('express').Router();
const ctrl   = require('../controllers/canchaController');
const { verifyToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/',                   ctrl.listar);
router.get('/:id/horarios',       ctrl.getHorarios);
router.post('/',   verifyToken, soloAdmin, ctrl.crear);
router.put('/:id', verifyToken, soloAdmin, ctrl.actualizar);

module.exports = router;
