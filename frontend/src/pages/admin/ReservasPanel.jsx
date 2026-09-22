import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { listarReservas, actualizarEstadoPago, resumenDia } from '../../api/adminApi';

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const OPCIONES_ESTADO = [
  { value: '', label: 'Todas' },
  { value: 'PENDIENTE_PAGO', label: 'Pendientes de pago' },
  { value: 'PAGADO', label: 'Pagadas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

export default function ReservasPanel() {
  const { token } = useAdminAuth();
  const [fecha, setFecha] = useState(hoyISO());
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [horaDesde, setHoraDesde] = useState('');
  const [horaHasta, setHoraHasta] = useState('');
  const [reservas, setReservas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    setError('');
    try {
      const [r, res] = await Promise.all([
        listarReservas(token, { fecha, estadoFiltro, horaDesde, horaHasta }),
        resumenDia(token, fecha),
      ]);
      setReservas(r);
      setResumen(res);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, estadoFiltro, horaDesde, horaHasta]);

  async function onTogglePago(reserva) {
    setError('');
    try {
      const nuevoEstado = reserva.estadoPago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
      await actualizarEstadoPago(token, reserva.id, nuevoEstado);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function onLimpiarFiltros() {
    setEstadoFiltro('');
    setHoraDesde('');
    setHoraHasta('');
  }

  return (
    <div>
      <h3>Reservas</h3>
      {error && <p className="error">{error}</p>}

      <div className="form-inline">
        <label>
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label>
          Estado
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            {OPCIONES_ESTADO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input type="time" value={horaDesde} onChange={(e) => setHoraDesde(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="time" value={horaHasta} onChange={(e) => setHoraHasta(e.target.value)} />
        </label>
        {(estadoFiltro || horaDesde || horaHasta) && (
          <button type="button" onClick={onLimpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      {resumen && (
        <p className="resumen">
          {resumen.cantidadReservas} reservas · {resumen.cantidadPagadas} pagadas · Total cobrado:{' '}
          <span className="resumen-destacado">${resumen.totalPagado.toLocaleString('es-CO')}</span>
        </p>
      )}

      <table className="tabla">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Cancha</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Bebidas</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((r) => (
            <tr key={r.id}>
              <td>
                {new Date(r.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(r.fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td>{r.cancha?.nombre}</td>
              <td>{r.cliente?.nombre}</td>
              <td>{r.cliente?.telefono}</td>
              <td>
                {r.reservaBebidas.length === 0
                  ? '-'
                  : r.reservaBebidas.map((b) => `${b.producto.nombre} x${b.cantidad}`).join(', ')}
              </td>
              <td>${Number(r.precioTotal).toLocaleString('es-CO')}</td>
              <td>{r.estado}</td>
              <td>
                <button
                  className={r.estadoPago === 'PAGADO' ? 'btn-primary' : ''}
                  onClick={() => onTogglePago(r)}
                  disabled={r.estado === 'CANCELADA'}
                >
                  {r.estadoPago === 'PAGADO' ? 'Pagado' : 'Pendiente'}
                </button>
              </td>
            </tr>
          ))}
          {reservas.length === 0 && (
            <tr>
              <td colSpan={8}>No hay reservas con esos filtros.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
