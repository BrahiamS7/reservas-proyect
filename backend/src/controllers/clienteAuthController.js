const clienteAuthService = require('../services/clienteAuthService');

async function solicitarOtp(req, res) {
  try {
    const { telefono, nombre } = req.body;
    const resultado = await clienteAuthService.solicitarOtp({ telefono, nombre });
    res.json(resultado);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function verificarOtp(req, res) {
  try {
    const { telefono, codigo } = req.body;
    const resultado = await clienteAuthService.verificarOtp({ telefono, codigo });
    if (!resultado) {
      return res.status(401).json({ error: 'Código inválido o expirado' });
    }
    res.json(resultado);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { solicitarOtp, verificarOtp };
