const tipoCanchaService = require('../services/tipoCanchaService');
const disponibilidadService = require('../services/disponibilidadService');

async function tiposCancha(req, res) {
  try {
    const tipos = await tipoCanchaService.listar(req.cliente.tenantId);
    res.json(tipos);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function disponibilidad(req, res) {
  try {
    const { tipoCanchaId, fecha } = req.query;
    const resultado = await disponibilidadService.obtenerDisponibilidad(req.cliente.tenantId, {
      tipoCanchaId,
      fecha,
    });
    res.json(resultado);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { tiposCancha, disponibilidad };
