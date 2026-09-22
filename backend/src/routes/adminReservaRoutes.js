const { Router } = require('express');
const adminReservaController = require('../controllers/adminReservaController');
const requireAdminAuth = require('../middlewares/adminAuthMiddleware');

const router = Router();

router.use(requireAdminAuth);

router.get('/resumen-dia', adminReservaController.resumenDia);
router.get('/', adminReservaController.listar);
router.get('/:id', adminReservaController.detalle);
router.patch('/:id/estado-pago', adminReservaController.actualizarEstadoPago);

module.exports = router;
