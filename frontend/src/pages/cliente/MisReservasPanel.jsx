import { useEffect, useState } from 'react';
import { useClienteAuth } from '../../context/ClienteAuthContext';
import { listarMisReservas, listarProductos, cancelarReserva, actualizarBebidasReserva } from '../../api/clienteApi';

export default function MisReservasPanel({ onCambio }) {
  const { token } = useClienteAuth();
  const [reservas, setReservas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [error, setError] = useState('');

  const [detalle, setDetalle] = useState(null); // reserva abierta en el modal
  const [cantidades, setCantidades] = useState({}); // productoId -> cantidad
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  async function cargar() {
    setError('');
    try {
      setReservas(await listarMisReservas(token));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargar();
    listarProductos(token).then(setProductos).catch(() => {});
  }, []);

  async function onCancelar(id) {
    setError('');
    try {
      await cancelarReserva(token, id);
      setConfirmandoId(null);
      cargar();
      onCambio?.();
    } catch (err) {
      setError(err.message);
    }
  }

  function abrirDetalle(reserva) {
    setDetalle(reserva);
    setErrorModal('');
    const iniciales = {};
    reserva.reservaBebidas.forEach((b) => {
      iniciales[b.productoId] = b.cantidad;
    });
    setCantidades(iniciales);
  }

  function onCambiarCantidad(productoId, cantidad) {
    setCantidades({ ...cantidades, [productoId]: cantidad });
  }

  async function onGuardarBebidas() {
    setErrorModal('');
    setGuardando(true);
    try {
      const bebidas = Object.entries(cantidades)
        .filter(([, cant]) => Number(cant) > 0)
        .map(([productoId, cantidad]) => ({ productoId, cantidad: Number(cantidad) }));

      await actualizarBebidasReserva(token, detalle.id, bebidas);
      setDetalle(null);
      cargar();
      onCambio?.();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <h3>Mis reservas</h3>
      {error && <p className="error">{error}</p>}

      <table className="tabla">
        <thead>
          <tr>
            <th>Cancha</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Total</th>
            <th>Pago</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((r) => (
            <tr key={r.id}>
              <td>{r.cancha.nombre}</td>
              <td>{new Date(r.inicio).toLocaleDateString('es-CO')}</td>
              <td>
                {new Date(r.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(r.fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td>${Number(r.precioTotal).toLocaleString('es-CO')}</td>
              <td>{r.estadoPago === 'PAGADO' ? 'Pagado' : 'Pendiente'}</td>
              <td>
                <button onClick={() => abrirDetalle(r)}>Detalle</button>{' '}
                {confirmandoId === r.id ? (
                  <>
                    <button onClick={() => onCancelar(r.id)}>Sí, cancelar</button>
                    <button onClick={() => setConfirmandoId(null)}>No</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmandoId(r.id)}>Cancelar</button>
                )}
              </td>
            </tr>
          ))}
          {reservas.length === 0 && (
            <tr>
              <td colSpan={6}>No tenés reservas próximas.</td>
            </tr>
          )}
        </tbody>
      </table>

      {detalle && (
        <div className="modal-fondo" onClick={() => setDetalle(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Detalle de la reserva</h3>
            <p>
              <strong>{detalle.cancha.nombre}</strong> ({detalle.cancha.tipoCancha.nombre})
              <br />
              {new Date(detalle.inicio).toLocaleDateString('es-CO')}{' '}
              {new Date(detalle.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} -{' '}
              {new Date(detalle.fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              <br />
              Pago: {detalle.estadoPago === 'PAGADO' ? 'Pagado' : 'Pendiente'}
            </p>

            <h4>Bebidas</h4>
            {productos.map((p) => (
              <div key={p.id} className="fila-producto">
                <span className="fila-producto-info">
                  {p.imagenUrl && <img src={p.imagenUrl} alt="" className="producto-mini" />}
                  {p.nombre} (${Number(p.precio).toLocaleString('es-CO')})
                </span>
                <input
                  type="number"
                  min="0"
                  value={cantidades[p.id] || ''}
                  onChange={(e) => onCambiarCantidad(p.id, e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}

            {errorModal && <p className="error">{errorModal}</p>}

            <div className="modal-acciones">
              <button onClick={onGuardarBebidas} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
