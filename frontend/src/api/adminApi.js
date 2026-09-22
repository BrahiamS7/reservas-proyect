import { http, qs } from './http';

export const adminLogin = (email, password) =>
  http('/admin/login', { method: 'POST', body: { email, password } });

export const listarTiposCancha = (token) => http('/admin/tipos-cancha', { token });
export const crearTipoCancha = (token, data) =>
  http('/admin/tipos-cancha', { method: 'POST', body: data, token });
export const actualizarTipoCancha = (token, id, data) =>
  http(`/admin/tipos-cancha/${id}`, { method: 'PUT', body: data, token });

export const listarCanchas = (token) => http('/admin/canchas', { token });
export const crearCancha = (token, data) => http('/admin/canchas', { method: 'POST', body: data, token });
export const actualizarCancha = (token, id, data) =>
  http(`/admin/canchas/${id}`, { method: 'PUT', body: data, token });
export const desactivarCancha = (token, id) => http(`/admin/canchas/${id}`, { method: 'DELETE', token });

export const listarProductos = (token) => http('/admin/productos', { token });
export const crearProducto = (token, data) => http('/admin/productos', { method: 'POST', body: data, token });
export const actualizarProducto = (token, id, data) =>
  http(`/admin/productos/${id}`, { method: 'PUT', body: data, token });
export const desactivarProducto = (token, id) => http(`/admin/productos/${id}`, { method: 'DELETE', token });

export const listarReservas = (token, params) => http(`/admin/reservas${qs(params)}`, { token });
export const detalleReserva = (token, id) => http(`/admin/reservas/${id}`, { token });
export const actualizarEstadoPago = (token, id, estadoPago) =>
  http(`/admin/reservas/${id}/estado-pago`, { method: 'PATCH', body: { estadoPago }, token });
export const resumenDia = (token, fecha) => http(`/admin/reservas/resumen-dia${qs({ fecha })}`, { token });
