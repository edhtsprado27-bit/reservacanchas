const router  = require('express').Router();
const ctrl    = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/perfil',    verifyToken, ctrl.perfil);

module.exports = router;
