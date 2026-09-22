const { Router } = require('express');
const clienteCanchaController = require('../controllers/clienteCanchaController');
const requireClienteAuth = require('../middlewares/clienteAuthMiddleware');

const router = Router();

router.use(requireClienteAuth);

router.get('/tipos-cancha', clienteCanchaController.tiposCancha);
router.get('/disponibilidad', clienteCanchaController.disponibilidad);

module.exports = router;
