const { Router } = require('express');
const tipoCanchaController = require('../controllers/tipoCanchaController');
const requireAdminAuth = require('../middlewares/adminAuthMiddleware');

const router = Router();

router.use(requireAdminAuth);

router.get('/', tipoCanchaController.listar);
router.post('/', tipoCanchaController.crear);
router.put('/:id', tipoCanchaController.actualizar);

module.exports = router;
