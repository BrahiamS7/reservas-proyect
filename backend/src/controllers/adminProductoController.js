const adminProductoService = require('../services/adminProductoService');

async function listar(req, res) {
  try {
    const productos = await adminProductoService.listar(req.admin.tenantId);
    res.json(productos);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function crear(req, res) {
  try {
    const producto = await adminProductoService.crear(req.admin.tenantId, req.body);
    res.status(201).json(producto);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function actualizar(req, res) {
  try {
    const producto = await adminProductoService.actualizar(req.admin.tenantId, req.params.id, req.body);
    res.json(producto);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function desactivar(req, res) {
  try {
    const producto = await adminProductoService.desactivar(req.admin.tenantId, req.params.id);
    res.json(producto);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { listar, crear, actualizar, desactivar };
