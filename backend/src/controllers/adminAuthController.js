const adminAuthService = require('../services/adminAuthService');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son requeridos' });
  }

  const resultado = await adminAuthService.login(email, password);
  if (!resultado) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  res.json(resultado);
}

module.exports = { login };
