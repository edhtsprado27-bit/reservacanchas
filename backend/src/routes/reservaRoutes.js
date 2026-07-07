const router = require('express').Router();
const ctrl   = require('../controllers/reservaController');
const { verifyToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/historial',  verifyToken,            ctrl.historial);
router.get('/todas',      verifyToken, soloAdmin, ctrl.todas);
router.get('/reporte',    verifyToken, soloAdmin, ctrl.reporte);
router.get('/ingresos',   verifyToken, soloAdmin, ctrl.reporteIngresos);
router.post('/',          verifyToken,            ctrl.crear);
router.put('/:id',        verifyToken, soloAdmin, ctrl.actualizar);
router.delete('/:id',     verifyToken,            ctrl.cancelar);

module.exports = router;
