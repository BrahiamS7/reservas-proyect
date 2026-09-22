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

module.exports = { OFFSET_HORAS, localAFechaUtc, fechaUtcALocal };
