const adminReservaService = require('../services/adminReservaService');

async function listar(req, res) {
  try {
    const { fecha, canchaId, estadoFiltro, horaDesde, horaHasta } = req.query;
    const reservas = await adminReservaService.listar(req.admin.tenantId, {
      fecha,
      canchaId,
      estadoFiltro,
      horaDesde,
      horaHasta,
    });
    res.json(reservas);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function detalle(req, res) {
  try {
    const reserva = await adminReservaService.detalle(req.admin.tenantId, req.params.id);
    res.json(reserva);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function actualizarEstadoPago(req, res) {
  try {
    const reserva = await adminReservaService.actualizarEstadoPago(
      req.admin.tenantId,
      req.params.id,
      req.body.estadoPago
    );
    res.json(reserva);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function resumenDia(req, res) {
  try {
    const resumen = await adminReservaService.resumenDia(req.admin.tenantId, req.query.fecha);
    res.json(resumen);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { listar, detalle, actualizarEstadoPago, resumenDia };
