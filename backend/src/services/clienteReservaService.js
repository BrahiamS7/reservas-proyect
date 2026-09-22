const prisma = require('../config/prisma');
const { fechaUtcALocal, formatearFechaHoraLocal } = require('../config/timezone');
const { enviarWhatsapp } = require('./whatsappService');

function crearError(mensaje, statusCode) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

function esErrorDeHorarioCruzado(error) {
  const mensaje = (error && error.message) || '';
  return mensaje.includes('no_reservas_cruzadas') || mensaje.toLowerCase().includes('exclusion');
}

function enviarConfirmacionWhatsapp(reserva) {
  const bebidas = reserva.reservaBebidas || [];
  const detalleBebidas = bebidas.length
    ? `\nBebidas: ${bebidas.map((b) => `${b.producto.nombre} x${b.cantidad}`).join(', ')}`
    : '';

  const mensaje =
    `Reserva confirmada ✅\n` +
    `Cancha: ${reserva.cancha.nombre} (${reserva.cancha.tipoCancha.nombre})\n` +
    `Horario: ${formatearFechaHoraLocal(reserva.inicio)} - ${formatearFechaHoraLocal(reserva.fin)}` +
    detalleBebidas +
    `\nTotal: $${Number(reserva.precioTotal).toLocaleString('es-CO')}`;

  return enviarWhatsapp(reserva.cliente.telefono, mensaje);
}

async function crearReserva(tenantId, clienteId, { canchaId, inicio, cantidadSlots, bebidas }) {
  if (!canchaId) throw crearError('canchaId es requerido', 400);
  if (!inicio) throw crearError('inicio es requerido', 400);

  const cantidad = cantidadSlots === undefined ? 1 : Number(cantidadSlots);
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    throw crearError('cantidadSlots debe ser un número entero mayor o igual a 1', 400);
  }

  const inicioDate = new Date(inicio);
  if (Number.isNaN(inicioDate.getTime())) throw crearError('inicio inválido', 400);
  if (inicioDate.getTime() < Date.now()) {
    throw crearError('No se puede reservar un horario que ya pasó', 400);
  }

  const [tenant, cancha] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.cancha.findFirst({
      where: { id: canchaId, tenantId, activa: true },
      include: { tipoCancha: true },
    }),
  ]);
  if (!cancha) throw crearError('Cancha no encontrada o inactiva', 400);

  const finDate = new Date(inicioDate.getTime() + tenant.duracionSlotMinutos * cantidad * 60000);

  const inicioLocal = fechaUtcALocal(inicioDate);
  const diaSemana = inicioLocal.getUTCDay();
  const horario = await prisma.horarioOperacion.findFirst({ where: { tenantId, diaSemana } });
  if (!horario) throw crearError('El complejo está cerrado ese día', 400);

  const inicioMin = inicioLocal.getUTCHours() * 60 + inicioLocal.getUTCMinutes();
  const finMin = inicioMin + tenant.duracionSlotMinutos * cantidad;
  const horarioInicioMin = horario.horaInicio.getUTCHours() * 60 + horario.horaInicio.getUTCMinutes();
  const horarioFinMin = horario.horaFin.getUTCHours() * 60 + horario.horaFin.getUTCMinutes();

  if (inicioMin < horarioInicioMin || finMin > horarioFinMin) {
    throw crearError('El horario solicitado está fuera del horario de operación', 400);
  }

  const itemsBebidas = Array.isArray(bebidas) ? bebidas : [];

  try {
    const reserva = await prisma.$transaction(async (tx) => {
      let subtotalBebidas = 0;
      const bebidasParaCrear = [];

      for (const item of itemsBebidas) {
        if (!item.productoId || !item.cantidad || item.cantidad <= 0) {
          throw crearError('Cada bebida necesita productoId y cantidad > 0', 400);
        }

        const producto = await tx.producto.findFirst({
          where: { id: item.productoId, tenantId, disponible: true },
        });
        if (!producto) throw crearError('Producto inválido o no disponible', 400);

        const descontado = await tx.producto.updateMany({
          where: { id: producto.id, stock: { gte: item.cantidad } },
          data: { stock: { decrement: item.cantidad } },
        });
        if (descontado.count === 0) {
          throw crearError(`Stock insuficiente para "${producto.nombre}"`, 409);
        }

        subtotalBebidas += Number(producto.precio) * item.cantidad;
        bebidasParaCrear.push({
          productoId: producto.id,
          cantidad: item.cantidad,
          precioUnitario: producto.precio,
        });
      }

      const precioTotal = Number(cancha.tipoCancha.precio) * cantidad + subtotalBebidas;

      return tx.reserva.create({
        data: {
          tenantId,
          canchaId,
          clienteId,
          inicio: inicioDate,
          fin: finDate,
          precioTotal,
          reservaBebidas: { create: bebidasParaCrear },
        },
        include: {
          cancha: { include: { tipoCancha: true } },
          cliente: true,
          reservaBebidas: { include: { producto: true } },
        },
      });
    });

    await enviarConfirmacionWhatsapp(reserva);
    return reserva;
  } catch (error) {
    if (error.statusCode) throw error;
    if (esErrorDeHorarioCruzado(error)) {
      throw crearError('Ese horario ya no está disponible, por favor elegí otro', 409);
    }
    throw error;
  }
}

async function listarPropias(tenantId, clienteId) {
  return prisma.reserva.findMany({
    where: {
      tenantId,
      clienteId,
      estado: { not: 'CANCELADA' },
      inicio: { gt: new Date() },
    },
    include: {
      cancha: { include: { tipoCancha: true } },
      reservaBebidas: { include: { producto: true } },
    },
    orderBy: { inicio: 'asc' },
  });
}

async function actualizarBebidas(tenantId, clienteId, id, bebidas) {
  const reserva = await prisma.reserva.findFirst({
    where: { id, tenantId, clienteId },
    include: { reservaBebidas: true, cancha: { include: { tipoCancha: true } } },
  });
  if (!reserva) throw crearError('Reserva no encontrada', 404);
  if (reserva.estado === 'CANCELADA') throw crearError('No se puede modificar una reserva cancelada', 400);
  if (reserva.inicio.getTime() < Date.now()) {
    throw crearError('No se puede modificar una reserva que ya empezó', 400);
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const cantidadSlots = Math.round(
    (reserva.fin.getTime() - reserva.inicio.getTime()) / (tenant.duracionSlotMinutos * 60000)
  );
  const precioBase = Number(reserva.cancha.tipoCancha.precio) * cantidadSlots;

  const itemsBebidas = Array.isArray(bebidas) ? bebidas : [];

  return prisma.$transaction(async (tx) => {
    // se devuelve el stock de las bebidas actuales antes de aplicar la nueva lista
    for (const item of reserva.reservaBebidas) {
      await tx.producto.update({
        where: { id: item.productoId },
        data: { stock: { increment: item.cantidad } },
      });
    }
    await tx.reservaBebida.deleteMany({ where: { reservaId: id } });

    let subtotalBebidas = 0;
    const bebidasParaCrear = [];

    for (const item of itemsBebidas) {
      if (!item.productoId || !item.cantidad || item.cantidad <= 0) {
        throw crearError('Cada bebida necesita productoId y cantidad > 0', 400);
      }

      const producto = await tx.producto.findFirst({
        where: { id: item.productoId, tenantId, disponible: true },
      });
      if (!producto) throw crearError('Producto inválido o no disponible', 400);

      const descontado = await tx.producto.updateMany({
        where: { id: producto.id, stock: { gte: item.cantidad } },
        data: { stock: { decrement: item.cantidad } },
      });
      if (descontado.count === 0) {
        throw crearError(`Stock insuficiente para "${producto.nombre}"`, 409);
      }

      subtotalBebidas += Number(producto.precio) * item.cantidad;
      bebidasParaCrear.push({
        productoId: producto.id,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
      });
    }

    return tx.reserva.update({
      where: { id },
      data: {
        precioTotal: precioBase + subtotalBebidas,
        reservaBebidas: { create: bebidasParaCrear },
      },
      include: {
        cancha: { include: { tipoCancha: true } },
        reservaBebidas: { include: { producto: true } },
      },
    });
  });
}

const MINUTOS_RECORDATORIO = 30;

async function listarRecordatorios(tenantId, clienteId) {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + MINUTOS_RECORDATORIO * 60000);

  return prisma.reserva.findMany({
    where: {
      tenantId,
      clienteId,
      estado: { not: 'CANCELADA' },
      inicio: { gt: ahora, lte: limite },
    },
    include: { cancha: { include: { tipoCancha: true } } },
    orderBy: { inicio: 'asc' },
  });
}

async function cancelar(tenantId, clienteId, id) {
  const reserva = await prisma.reserva.findFirst({
    where: { id, tenantId, clienteId },
    include: { reservaBebidas: true },
  });
  if (!reserva) throw crearError('Reserva no encontrada', 404);
  if (reserva.estado === 'CANCELADA') throw crearError('La reserva ya estaba cancelada', 400);

  return prisma.$transaction(async (tx) => {
    for (const item of reserva.reservaBebidas) {
      await tx.producto.update({
        where: { id: item.productoId },
        data: { stock: { increment: item.cantidad } },
      });
    }

    return tx.reserva.update({
      where: { id },
      data: { estado: 'CANCELADA' },
      include: {
        cancha: { include: { tipoCancha: true } },
        reservaBebidas: { include: { producto: true } },
      },
    });
  });
}

module.exports = { crearReserva, listarPropias, actualizarBebidas, listarRecordatorios, cancelar };
