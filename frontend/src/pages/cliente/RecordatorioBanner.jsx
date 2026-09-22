import { useEffect, useState } from 'react';
import { useClienteAuth } from '../../context/ClienteAuthContext';
import { listarRecordatorio, cancelarReserva } from '../../api/clienteApi';

export default function RecordatorioBanner({ onCambio }) {
  const { token } = useClienteAuth();
  const [reservas, setReservas] = useState([]);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    try {
      setReservas(await listarRecordatorio(token));
    } catch {
      // silencioso: el recordatorio no debe romper el resto de la app
    }
  }

  useEffect(() => {
    cargar();
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

  if (reservas.length === 0) return null;

  return (
    <div className="recordatorio">
      {error && <p className="error">{error}</p>}
      {reservas.map((r) => (
        <div key={r.id} className="recordatorio-item">
          ⏰ Tenés una reserva en <strong>{r.cancha.nombre}</strong> a las{' '}
          {new Date(r.inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}.
          {confirmandoId === r.id ? (
            <>
              <span>¿Seguro?</span>
              <button onClick={() => onCancelar(r.id)}>Sí, cancelar</button>
              <button onClick={() => setConfirmandoId(null)}>No</button>
            </>
          ) : (
            <button onClick={() => setConfirmandoId(r.id)}>Cancelar</button>
          )}
        </div>
      ))}
    </div>
  );
}
