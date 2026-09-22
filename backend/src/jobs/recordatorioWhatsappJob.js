const cron = require('node-cron');
const prisma = require('../config/prisma');
const { formatearFechaHoraLocal } = require('../config/timezone');
const { enviarWhatsapp } = require('../services/whatsappService');

const MINUTOS_RECORDATORIO = 20;

async function enviarRecordatoriosPendientes() {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + MINUTOS_RECORDATORIO * 60000);

  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { not: 'CANCELADA' },
      recordatorioEnviado: false,
      inicio: { gt: ahora, lte: limite },
    },
    include: { cancha: true, cliente: true },
  });

  for (const reserva of reservas) {
    const mensaje =
      `Recordatorio ⏰ Tenés una reserva en ${reserva.cancha.nombre} a las ` +
      `${formatearFechaHoraLocal(reserva.inicio)}. ¡Te esperamos!`;

    await enviarWhatsapp(reserva.cliente.telefono, mensaje);

    await prisma.reserva.update({
      where: { id: reserva.id },
      data: { recordatorioEnviado: true },
    });
  }
}

function iniciar() {
  cron.schedule('* * * * *', () => {
    enviarRecordatoriosPendientes().catch((error) => {
      console.error('[RECORDATORIO WHATSAPP] Error al procesar recordatorios:', error.message);
    });
  });
}

module.exports = { iniciar, enviarRecordatoriosPendientes };
