const { Router } = require('express');
const canchaController = require('../controllers/canchaController');
const requireAdminAuth = require('../middlewares/adminAuthMiddleware');

const router = Router();

router.use(requireAdminAuth);

router.get('/', canchaController.listar);
router.post('/', canchaController.crear);
router.put('/:id', canchaController.actualizar);
router.delete('/:id', canchaController.desactivar);

module.exports = router;
