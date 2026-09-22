const productoService = require('../services/productoService');

async function listar(req, res) {
  try {
    const productos = await productoService.listarDisponibles(req.cliente.tenantId);
    res.json(productos);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { listar };
