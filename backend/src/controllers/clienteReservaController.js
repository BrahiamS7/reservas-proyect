const clienteReservaService = require('../services/clienteReservaService');

async function crear(req, res) {
  try {
    const reserva = await clienteReservaService.crearReserva(
      req.cliente.tenantId,
      req.cliente.clienteId,
      req.body
    );
    res.status(201).json(reserva);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function recordatorio(req, res) {
  try {
    const reservas = await clienteReservaService.listarRecordatorios(
      req.cliente.tenantId,
      req.cliente.clienteId
    );
    res.json(reservas);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function cancelar(req, res) {
  try {
    const reserva = await clienteReservaService.cancelar(
      req.cliente.tenantId,
      req.cliente.clienteId,
      req.params.id
    );
    res.json(reserva);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function misReservas(req, res) {
  try {
    const reservas = await clienteReservaService.listarPropias(req.cliente.tenantId, req.cliente.clienteId);
    res.json(reservas);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function actualizarBebidas(req, res) {
  try {
    const reserva = await clienteReservaService.actualizarBebidas(
      req.cliente.tenantId,
      req.cliente.clienteId,
      req.params.id,
      req.body.bebidas
    );
    res.json(reserva);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { crear, misReservas, actualizarBebidas, recordatorio, cancelar };
