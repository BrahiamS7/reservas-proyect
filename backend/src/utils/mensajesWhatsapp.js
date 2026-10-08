const { formatearDiaLocal, formatearHoraLocal } = require('../config/timezone');

const primerNombre = (nombre) => nombre.trim().split(/\s+/)[0];
const rangoHorario = (reserva) => `${formatearHoraLocal(reserva.inicio)} - ${formatearHoraLocal(reserva.fin)}`;

function mensajeCodigo({ codigo, minutos, negocio }) {
  return (
    `🔐 *Tu código de verificación*\n\n` +
    `*${codigo}*\n\n` +
    `Úsalo para entrar a ${negocio}. Vence en ${minutos} minutos.\n` +
    `Si no fuiste tú, puedes ignorar este mensaje.`
  );
}

function mensajeConfirmacion(reserva, negocio) {
  const bebidas = reserva.reservaBebidas || [];
  const lineaBebidas = bebidas.length
    ? `\n🥤 ${bebidas.map((b) => `${b.producto.nombre} x${b.cantidad}`).join(', ')}`
    : '';

  return (
    `¡Hola, ${primerNombre(reserva.cliente.nombre)}! 👋\n` +
    `Tu reserva quedó confirmada ✅\n\n` +
    `🏟️ *${reserva.cancha.nombre}* (${reserva.cancha.tipoCancha.nombre})\n` +
    `📅 ${formatearDiaLocal(reserva.inicio)}\n` +
    `🕐 ${rangoHorario(reserva)}` +
    lineaBebidas +
    `\n💰 Total: *$${Number(reserva.precioTotal).toLocaleString('es-CO')}* · pagas en la cancha\n\n` +
    `¡Te esperamos! 🙌\n` +
    `— ${negocio}`
  );
}

function mensajeRecordatorio(reserva, negocio) {
  return (
    `⏰ ¡Hola, ${primerNombre(reserva.cliente.nombre)}! Tu reserva empieza en unos minutos\n\n` +
    `🏟️ *${reserva.cancha.nombre}*\n` +
    `🕐 ${rangoHorario(reserva)}\n\n` +
    `¡Te esperamos! 🙌\n` +
    `— ${negocio}`
  );
}

module.exports = { mensajeCodigo, mensajeConfirmacion, mensajeRecordatorio };
