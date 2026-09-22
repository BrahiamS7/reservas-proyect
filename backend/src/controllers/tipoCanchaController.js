const tipoCanchaService = require('../services/tipoCanchaService');

async function listar(req, res) {
  try {
    const tipos = await tipoCanchaService.listar(req.admin.tenantId);
    res.json(tipos);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function crear(req, res) {
  try {
    const tipo = await tipoCanchaService.crear(req.admin.tenantId, req.body);
    res.status(201).json(tipo);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function actualizar(req, res) {
  try {
    const tipo = await tipoCanchaService.actualizar(req.admin.tenantId, req.params.id, req.body);
    res.json(tipo);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { listar, crear, actualizar };
