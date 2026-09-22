const { Router } = require('express');
const clienteReservaController = require('../controllers/clienteReservaController');
const requireClienteAuth = require('../middlewares/clienteAuthMiddleware');

const router = Router();

router.use(requireClienteAuth);

router.post('/', clienteReservaController.crear);
router.get('/', clienteReservaController.misReservas);
router.get('/recordatorio', clienteReservaController.recordatorio);
router.patch('/:id/cancelar', clienteReservaController.cancelar);
router.patch('/:id/bebidas', clienteReservaController.actualizarBebidas);

module.exports = router;
