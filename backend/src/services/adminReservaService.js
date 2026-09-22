const prisma = require('../config/prisma');
const { localAFechaUtc } = require('../config/timezone');

function crearError(mensaje, statusCode) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

function parsearFecha(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) {
    throw crearError('fecha debe tener formato YYYY-MM-DD', 400);
  }
  const [year, mes, dia] = fecha.split('-').map(Number);
  return { year, mes, dia };
}

function rangoDia(fecha) {
  const { year, mes, dia } = parsearFecha(fecha);
  return {
    inicioDia: localAFechaUtc(year, mes, dia, 0, 0),
    finDia: localAFechaUtc(year, mes, dia + 1, 0, 0),
  };
}

function conSubtotalBebidas(reserva) {
  const subtotalBebidas = reserva.reservaBebidas.reduce(
    (acc, item) => acc + Number(item.precioUnitario) * item.cantidad,
    0
  );
  return { ...reserva, subtotalBebidas };
}

const INCLUDE_RESERVA = {
  cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
  cancha: { select: { id: true, nombre: true, tipoCancha: { select: { id: true, nombre: true } } } },
  reservaBebidas: { include: { producto: { select: { id: true, nombre: true } } } },
};

async function listar(tenantId, { fecha, canchaId, estadoFiltro, horaDesde, horaHasta }) {
  const where = { tenantId };

  if (fecha) {
    const { year, mes, dia } = parsearFecha(fecha);
    let desde = localAFechaUtc(year, mes, dia, 0, 0);
    let hasta = localAFechaUtc(year, mes, dia + 1, 0, 0);

    if (horaDesde) {
      const [h, m] = horaDesde.split(':').map(Number);
      desde = localAFechaUtc(year, mes, dia, h, m || 0);
    }
    if (horaHasta) {
      const [h, m] = horaHasta.split(':').map(Number);
      hasta = localAFechaUtc(year, mes, dia, h, m || 0);
    }
    where.inicio = { gte: desde, lt: hasta };
  }

  if (canchaId) where.canchaId = canchaId;

  if (estadoFiltro === 'CANCELADA') {
    where.estado = 'CANCELADA';
  } else if (estadoFiltro === 'PAGADO') {
    where.estadoPago = 'PAGADO';
    where.estado = { not: 'CANCELADA' };
  } else if (estadoFiltro === 'PENDIENTE_PAGO') {
    where.estadoPago = 'PENDIENTE';
    where.estado = { not: 'CANCELADA' };
  }

  const reservas = await prisma.reserva.findMany({
    where,
    include: INCLUDE_RESERVA,
    orderBy: { inicio: 'asc' },
  });

  return reservas.map(conSubtotalBebidas);
}

async function detalle(tenantId, id) {
  const reserva = await prisma.reserva.findFirst({
    where: { id, tenantId },
    include: INCLUDE_RESERVA,
  });
  if (!reserva) throw crearError('Reserva no encontrada', 404);
  return conSubtotalBebidas(reserva);
}

async function actualizarEstadoPago(tenantId, id, estadoPago) {
  if (!['PENDIENTE', 'PAGADO'].includes(estadoPago)) {
    throw crearError('estadoPago debe ser PENDIENTE o PAGADO', 400);
  }

  const reserva = await prisma.reserva.findFirst({ where: { id, tenantId } });
  if (!reserva) throw crearError('Reserva no encontrada', 404);
  if (reserva.estado === 'CANCELADA') {
    throw crearError('No se puede modificar el pago de una reserva cancelada', 400);
  }

  await prisma.reserva.update({ where: { id }, data: { estadoPago } });
  return detalle(tenantId, id);
}

async function resumenDia(tenantId, fecha) {
  const { inicioDia, finDia } = rangoDia(fecha);

  const reservas = await prisma.reserva.findMany({
    where: { tenantId, inicio: { gte: inicioDia, lt: finDia }, estado: { not: 'CANCELADA' } },
    select: { precioTotal: true, estadoPago: true },
  });

  const pagadas = reservas.filter((r) => r.estadoPago === 'PAGADO');
  const totalPagado = pagadas.reduce((acc, r) => acc + Number(r.precioTotal), 0);

  return {
    fecha,
    cantidadReservas: reservas.length,
    cantidadPagadas: pagadas.length,
    totalPagado,
  };
}

module.exports = { listar, detalle, actualizarEstadoPago, resumenDia };
