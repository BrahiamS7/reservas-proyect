const { Router } = require('express');
const adminProductoController = require('../controllers/adminProductoController');
const requireAdminAuth = require('../middlewares/adminAuthMiddleware');

const router = Router();

router.use(requireAdminAuth);

router.get('/', adminProductoController.listar);
router.post('/', adminProductoController.crear);
router.put('/:id', adminProductoController.actualizar);
router.delete('/:id', adminProductoController.desactivar);

module.exports = router;
