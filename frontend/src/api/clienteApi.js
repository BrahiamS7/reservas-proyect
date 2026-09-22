import { http, qs } from './http';

export const solicitarOtp = (telefono, nombre) =>
  http('/cliente/otp/solicitar', { method: 'POST', body: { telefono, nombre } });

export const verificarOtp = (telefono, codigo) =>
  http('/cliente/otp/verificar', { method: 'POST', body: { telefono, codigo } });

export const listarTiposCancha = (token) => http('/cliente/tipos-cancha', { token });

export const obtenerDisponibilidad = (token, tipoCanchaId, fecha) =>
  http(`/cliente/disponibilidad${qs({ tipoCanchaId, fecha })}`, { token });

export const listarProductos = (token) => http('/cliente/productos', { token });

export const crearReserva = (token, data) => http('/cliente/reservas', { method: 'POST', body: data, token });

export const listarMisReservas = (token) => http('/cliente/reservas', { token });

export const listarRecordatorio = (token) => http('/cliente/reservas/recordatorio', { token });

export const cancelarReserva = (token, id) =>
  http(`/cliente/reservas/${id}/cancelar`, { method: 'PATCH', token });

export const actualizarBebidasReserva = (token, id, bebidas) =>
  http(`/cliente/reservas/${id}/bebidas`, { method: 'PATCH', body: { bebidas }, token });
