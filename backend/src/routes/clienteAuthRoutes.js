const { Router } = require('express');
const clienteAuthController = require('../controllers/clienteAuthController');
const requireClienteAuth = require('../middlewares/clienteAuthMiddleware');

const router = Router();

router.post('/otp/solicitar', clienteAuthController.solicitarOtp);
router.post('/otp/verificar', clienteAuthController.verificarOtp);

router.get('/me', requireClienteAuth, (req, res) => {
  res.json({ cliente: req.cliente });
});

module.exports = router;
