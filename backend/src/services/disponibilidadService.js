const prisma = require('../config/prisma');
const { localAFechaUtc } = require('../config/timezone');

function crearError(mensaje, statusCode) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function parsearFecha(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) {
    throw crearError('fecha debe tener formato YYYY-MM-DD', 400);
  }
  const [year, mes, dia] = fecha.split('-').map(Number);
  return { year, mes, dia };
}

async function obtenerDisponibilidad(tenantId, { tipoCanchaId, fecha }) {
  if (!tipoCanchaId) throw crearError('tipoCanchaId es requerido', 400);
  const { year, mes, dia } = parsearFecha(fecha);

  const [tenant, tipoCancha] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.tipoCancha.findFirst({ where: { id: tipoCanchaId, tenantId } }),
  ]);
  if (!tipoCancha) throw crearError('tipoCanchaId inválido para este tenant', 400);

  const canchas = await prisma.cancha.findMany({
    where: { tenantId, tipoCanchaId, activa: true },
    orderBy: { nombre: 'asc' },
  });

  const diaSemana = new Date(Date.UTC(year, mes - 1, dia)).getUTCDay();
  const horario = await prisma.horarioOperacion.findFirst({ where: { tenantId, diaSemana } });

  if (!horario) {
    return {
      fecha,
      tipoCancha: { id: tipoCancha.id, nombre: tipoCancha.nombre, precio: tipoCancha.precio },
      cerrado: true,
      canchas: canchas.map((c) => ({ id: c.id, nombre: c.nombre, imagenUrl: c.imagenUrl, slots: [] })),
    };
  }

  const inicioOperacionMin = horario.horaInicio.getUTCHours() * 60 + horario.horaInicio.getUTCMinutes();
  const finOperacionMin = horario.horaFin.getUTCHours() * 60 + horario.horaFin.getUTCMinutes();
  const duracionMin = tenant.duracionSlotMinutos;

  const inicioDia = localAFechaUtc(year, mes, dia, 0, 0);
  const finDia = localAFechaUtc(year, mes, dia + 1, 0, 0);
  const canchaIds = canchas.map((c) => c.id);

  const reservas = canchaIds.length
    ? await prisma.reserva.findMany({
        where: {
          canchaId: { in: canchaIds },
          estado: { not: 'CANCELADA' },
          inicio: { lt: finDia },
          fin: { gt: inicioDia },
        },
      })
    : [];

  const ahoraMs = Date.now();

  const resultado = canchas.map((cancha) => {
    const slots = [];
    for (let minutos = inicioOperacionMin; minutos < finOperacionMin; minutos += duracionMin) {
      const finMinutos = minutos + duracionMin;
      const horaInicioSlot = Math.floor(minutos / 60);
      const minInicioSlot = minutos % 60;
      const horaFinSlot = Math.floor(finMinutos / 60);
      const minFinSlot = finMinutos % 60;

      const inicioUtc = localAFechaUtc(year, mes, dia, horaInicioSlot, minInicioSlot);
      const finUtc = localAFechaUtc(year, mes, dia, horaFinSlot, minFinSlot);
      const inicioMs = inicioUtc.getTime();
      const finMs = finUtc.getTime();

      const ocupado = reservas.some(
        (r) => r.canchaId === cancha.id && r.inicio.getTime() < finMs && r.fin.getTime() > inicioMs
      );
      const yaPaso = finMs <= ahoraMs;

      slots.push({
        etiqueta: `${pad(horaInicioSlot)}:${pad(minInicioSlot)} - ${pad(horaFinSlot)}:${pad(minFinSlot)}`,
        inicio: inicioUtc.toISOString(),
        fin: finUtc.toISOString(),
        disponible: !ocupado && !yaPaso,
      });
    }
    return { id: cancha.id, nombre: cancha.nombre, imagenUrl: cancha.imagenUrl, slots };
  });

  return {
    fecha,
    tipoCancha: { id: tipoCancha.id, nombre: tipoCancha.nombre, precio: tipoCancha.precio },
    cerrado: false,
    canchas: resultado,
  };
}

module.exports = { obtenerDisponibilidad };
