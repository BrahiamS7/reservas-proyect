const { Router } = require('express');
const clienteProductoController = require('../controllers/clienteProductoController');
const requireClienteAuth = require('../middlewares/clienteAuthMiddleware');

const router = Router();

router.use(requireClienteAuth);

router.get('/', clienteProductoController.listar);

module.exports = router;
