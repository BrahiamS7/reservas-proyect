const canchaService = require('../services/canchaService');

async function listar(req, res) {
  try {
    const canchas = await canchaService.listar(req.admin.tenantId);
    res.json(canchas);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function crear(req, res) {
  try {
    const cancha = await canchaService.crear(req.admin.tenantId, req.body);
    res.status(201).json(cancha);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function actualizar(req, res) {
  try {
    const cancha = await canchaService.actualizar(req.admin.tenantId, req.params.id, req.body);
    res.json(cancha);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function desactivar(req, res) {
  try {
    const cancha = await canchaService.desactivar(req.admin.tenantId, req.params.id);
    res.json(cancha);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { listar, crear, actualizar, desactivar };
