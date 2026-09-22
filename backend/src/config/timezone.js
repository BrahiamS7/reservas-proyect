// Colombia: UTC-5 todo el año (sin horario de verano).
// TEMPORAL: asume un único huso horario para todo el sistema. Si en el futuro
// se vende a un negocio en otro país/huso, esto debería pasar a ser un campo
// por Tenant en vez de una constante global.
const OFFSET_HORAS = -5;

// Convierte una hora local (año, mes 1-12, día, hora, minuto) al instante UTC real.
function localAFechaUtc(year, mes, dia, hora = 0, minuto = 0) {
  return new Date(Date.UTC(year, mes - 1, dia, hora - OFFSET_HORAS, minuto));
}

// Convierte un instante UTC real a un Date cuyos componentes UTC representan
// la hora local del complejo (útil para leer año/mes/día/hora/minuto locales
// con getUTC* sin que el huso horario del servidor interfiera).
function fechaUtcALocal(fecha) {
  return new Date(fecha.getTime() + OFFSET_HORAS * 3600000);
}

function formatearFechaHoraLocal(fecha) {
  const local = fechaUtcALocal(fecha);
  const dia = String(local.getUTCDate()).padStart(2, '0');
  const mes = String(local.getUTCMonth() + 1).padStart(2, '0');
  const horas = String(local.getUTCHours()).padStart(2, '0');
  const minutos = String(local.getUTCMinutes()).padStart(2, '0');
  return `${dia}/${mes} ${horas}:${minutos}`;
}

module.exports = { OFFSET_HORAS, localAFechaUtc, fechaUtcALocal, formatearFechaHoraLocal };
