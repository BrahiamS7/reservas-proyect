import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClienteAuth } from '../../context/ClienteAuthContext';
import {
  listarTiposCancha,
  obtenerDisponibilidad,
  listarProductos,
  crearReserva,
} from '../../api/clienteApi';
import RecordatorioBanner from './RecordatorioBanner';
import MisReservasPanel from './MisReservasPanel';

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ClienteAppPage() {
  const { cliente, token, logout } = useClienteAuth();
  const navigate = useNavigate();

  const [tipos, setTipos] = useState([]);
  const [tipoCanchaId, setTipoCanchaId] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [error, setError] = useState('');

  // Selección por arrastre: mientras se sostiene el mouse, se va extendiendo
  // el rango de slots consecutivos y disponibles dentro de la misma cancha.
  const [seleccion, setSeleccion] = useState(null); // { canchaId, canchaNombre, inicioIdx, finIdx }
  const [arrastrando, setArrastrando] = useState(false);

  const [slotSeleccionado, setSlotSeleccionado] = useState(null); // { canchaId, canchaNombre, inicio, etiqueta, cantidadSlots }
  const [productos, setProductos] = useState([]);
  const [cantidades, setCantidades] = useState({}); // productoId -> cantidad
  const [confirmando, setConfirmando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [vista, setVista] = useState('reservar'); // 'reservar' | 'misReservas'
  const [refrescoKey, setRefrescoKey] = useState(0);

  useEffect(() => {
    listarTiposCancha(token).then(setTipos).catch((err) => setError(err.message));
    listarProductos(token).then(setProductos).catch(() => {});
  }, []);

  // Cualquier cambio hecho en otro lado (cancelar desde "Mis reservas" o desde
  // el recordatorio, crear una reserva) bumpea refrescoKey — si ya hay una
  // grilla cargada, la volvemos a pedir para que no quede desactualizada.
  useEffect(() => {
    if (tipoCanchaId) cargarDisponibilidad(tipoCanchaId, fecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refrescoKey]);

  async function cargarDisponibilidad(tipoId, f) {
    setError('');
    setDisponibilidad(null);
    try {
      const data = await obtenerDisponibilidad(token, tipoId, f);
      setDisponibilidad(data);
    } catch (err) {
      setError(err.message);
    }
  }

  function onElegirTipo(tipo) {
    setTipoCanchaId(tipo.id);
    setMensajeExito('');
    cargarDisponibilidad(tipo.id, fecha);
  }

  function onCambiarFecha(nuevaFecha) {
    setFecha(nuevaFecha);
    if (tipoCanchaId) cargarDisponibilidad(tipoCanchaId, nuevaFecha);
  }

  function iniciarArrastre(cancha, idx, slot) {
    if (!slot.disponible) return;
    setSeleccion({ canchaId: cancha.id, canchaNombre: cancha.nombre, inicioIdx: idx, finIdx: idx });
    setArrastrando(true);
  }

  function extenderArrastre(cancha, idx) {
    if (!arrastrando || !seleccion || seleccion.canchaId !== cancha.id) return;
    if (idx < seleccion.inicioIdx) return; // solo se admite arrastrar hacia horarios más tarde

    let fin = seleccion.inicioIdx;
    for (let i = seleccion.inicioIdx; i <= idx; i++) {
      if (!cancha.slots[i].disponible) break;
      fin = i;
    }
    setSeleccion((s) => (s ? { ...s, finIdx: fin } : s));
  }

  // Se registra en window (no solo en los botones) para no perder el mouseup
  // si el usuario suelta el click fuera de un slot.
  useEffect(() => {
    function finalizarArrastre() {
      if (!arrastrando || !seleccion || !disponibilidad) return;
      setArrastrando(false);

      const cancha = disponibilidad.canchas.find((c) => c.id === seleccion.canchaId);
      if (!cancha) return;

      const primerSlot = cancha.slots[seleccion.inicioIdx];
      const ultimoSlot = cancha.slots[seleccion.finIdx];
      const cantidadSlots = seleccion.finIdx - seleccion.inicioIdx + 1;

      setSlotSeleccionado({
        canchaId: cancha.id,
        canchaNombre: cancha.nombre,
        inicio: primerSlot.inicio,
        etiqueta: `${primerSlot.etiqueta.split(' - ')[0]} - ${ultimoSlot.etiqueta.split(' - ')[1]}`,
        cantidadSlots,
      });
      setSeleccion(null);
      setCantidades({});
      setMensajeExito('');
    }

    window.addEventListener('mouseup', finalizarArrastre);
    return () => window.removeEventListener('mouseup', finalizarArrastre);
  }, [arrastrando, seleccion, disponibilidad]);

  function onCambiarCantidad(productoId, cantidad) {
    setCantidades({ ...cantidades, [productoId]: cantidad });
  }

  async function onConfirmarReserva() {
    setError('');
    setConfirmando(true);
    try {
      const bebidas = Object.entries(cantidades)
        .filter(([, cant]) => Number(cant) > 0)
        .map(([productoId, cantidad]) => ({ productoId, cantidad: Number(cantidad) }));

      const reserva = await crearReserva(token, {
        canchaId: slotSeleccionado.canchaId,
        inicio: slotSeleccionado.inicio,
        cantidadSlots: slotSeleccionado.cantidadSlots,
        bebidas,
      });

      setMensajeExito(
        `¡Reserva confirmada en ${reserva.cancha.nombre} (${slotSeleccionado.etiqueta})! Total: $${Number(
          reserva.precioTotal
        ).toLocaleString('es-CO')}`
      );
      setSlotSeleccionado(null);
      setRefrescoKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmando(false);
    }
  }

  function onLogout() {
    logout();
    navigate('/cliente/login');
  }

  return (
    <div className="panel">
      <header className="panel-header">
        <h2>Hola, {cliente?.nombre}</h2>
        <button onClick={onLogout}>Salir</button>
      </header>

      <RecordatorioBanner key={`recordatorio-${refrescoKey}`} onCambio={() => setRefrescoKey((k) => k + 1)} />

      <nav className="tabs">
        <button className={vista === 'reservar' ? 'tab-activo' : ''} onClick={() => setVista('reservar')}>
          Reservar
        </button>
        <button className={vista === 'misReservas' ? 'tab-activo' : ''} onClick={() => setVista('misReservas')}>
          Mis reservas
        </button>
      </nav>

      {vista === 'misReservas' && (
        <MisReservasPanel key={`misreservas-${refrescoKey}`} onCambio={() => setRefrescoKey((k) => k + 1)} />
      )}

      {vista === 'reservar' && (
        <>
          <div className="tipos-grid">
            {tipos.map((t) => (
              <button
                key={t.id}
                className={`tipo-card${t.id === tipoCanchaId ? ' tipo-card-activa' : ''}`}
                onClick={() => onElegirTipo(t)}
              >
                <span className="tipo-card-nombre">{t.nombre}</span>
                <span className="tipo-card-precio">${Number(t.precio).toLocaleString('es-CO')} / hora</span>
              </button>
            ))}
          </div>

          {tipoCanchaId && (
            <div className="form-inline">
              <label>
                Fecha
                <input type="date" value={fecha} onChange={(e) => onCambiarFecha(e.target.value)} />
              </label>
            </div>
          )}

          {tipoCanchaId && <p className="ayuda">Hacé click en un horario, o arrastrá para reservar varias horas seguidas.</p>}

          {error && <p className="error">{error}</p>}
          {mensajeExito && <p className="exito">{mensajeExito}</p>}

          {disponibilidad?.cerrado && <p>El complejo está cerrado ese día.</p>}

          {disponibilidad && !disponibilidad.cerrado && (
            <div className="grilla-canchas">
              {disponibilidad.canchas.map((cancha) => (
                <div key={cancha.id} className="fila-cancha">
                  <div className="fila-cancha-titulo">
                    {cancha.imagenUrl && <img src={cancha.imagenUrl} alt="" className="producto-mini" />}
                    <strong>{cancha.nombre}</strong>
                  </div>
                  <div className="slots">
                    {cancha.slots.map((slot, idx) => {
                      const enSeleccion =
                        seleccion &&
                        seleccion.canchaId === cancha.id &&
                        idx >= seleccion.inicioIdx &&
                        idx <= seleccion.finIdx;
                      let claseSlot = slot.disponible ? 'slot slot-verde' : 'slot slot-rojo';
                      if (enSeleccion) claseSlot += ' slot-seleccionando';
                      return (
                        <button
                          key={slot.inicio}
                          disabled={!slot.disponible}
                          className={claseSlot}
                          onMouseDown={() => iniciarArrastre(cancha, idx, slot)}
                          onMouseEnter={() => extenderArrastre(cancha, idx)}
                        >
                          {slot.etiqueta}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {slotSeleccionado && (
            <div className="modal-fondo" onClick={() => setSlotSeleccionado(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Confirmar reserva</h3>
                <p>
                  {slotSeleccionado.canchaNombre} — {slotSeleccionado.etiqueta}
                  {slotSeleccionado.cantidadSlots > 1 && ` (${slotSeleccionado.cantidadSlots} horas)`}
                </p>

                <h4>Bebidas (opcional)</h4>
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

                <div className="modal-acciones">
                  <button className="btn-primary" onClick={onConfirmarReserva} disabled={confirmando}>
                    {confirmando ? 'Confirmando...' : 'Confirmar reserva'}
                  </button>
                  <button onClick={() => setSlotSeleccionado(null)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
